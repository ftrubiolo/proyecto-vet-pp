import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { estados_cita, mascotas, mascotas_propietarios, clinicas_mascotas, veterinarios_clinicas } from "../db/schema";

import type { MascotaDb, NewMascota, DBClient } from '../types/db.types';
import { MascotaList, MascotaPerfil } from "../types/mascota.types";

/**
 * Servicio para la gestión de mascotas (pacientes).
 */
export class MascotaService {
    /**
     * Obtiene todas las mascotas.
     * @returns Lista de mascotas.
     */
    static async getAll(): Promise<MascotaList[] | null> {
        const result = await db.query.mascotas.findMany({
            with: {
                raza: {
                    with: {
                        especie: true,
                    }
                },
            }
        });
        if (!result) return null;
        return result.flatMap((m) => {
            return [{
                id: m.id,
                nombre: m.nombre,
                foto_url: m.foto_url,
                fecha_nacimiento: m.fecha_nacimiento,
                edad: MascotaService.calcularEdad(m.fecha_nacimiento),
                sexo: m.sexo as 'M' | 'H',
                especie: m.raza.especie.especie,
                raza: m.raza.raza,
                es_castrado: m.es_castrado,
                numero_microchip: m.numero_microchip,
            }];
        });
    }

    /**
     * Obtiene todas las mascotas de un propietario.
     * @param propietarioId - ID del propietario.
     * @returns Lista de mascotas del propietario.
     */
    static async getAllMascotasByPropietarioId(propietarioId: string): Promise<MascotaPerfil[] | null> {
        const result = await db.query.mascotas_propietarios.findMany({
            where: eq(mascotas_propietarios.propietario_id, propietarioId),
            with: {
                mascota: {
                    with: {
                        raza: {
                            with: {
                                especie: true,
                            }
                        },
                        mascotas_propietarios: {
                            with: {
                                propietario: {
                                    columns: {
                                        nombre: true,
                                        apellido: true,
                                        es_empresa: true,
                                        razon_social: true,
                                    }
                                },
                                tipo_relacion: {
                                    columns: {
                                        tipo: true,
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        if (!result) return null;

        return result.flatMap((relation) => {
            const m = relation.mascota;
            if (!m) return [];

            return [{
                id: m.id,
                nombre: m.nombre,
                foto_url: m.foto_url,
                edad: MascotaService.calcularEdad(m.fecha_nacimiento),
                fecha_nacimiento: m.fecha_nacimiento,
                sexo: m.sexo as 'M' | 'H',
                especie: m.raza.especie.especie,
                raza: m.raza.raza,
                es_castrado: m.es_castrado,
                numero_microchip: m.numero_microchip,
                propietarios: m.mascotas_propietarios.flatMap((mp) => {
                    const p = mp.propietario;
                    if (!p) return [];
                    return [{
                        id: mp.propietario_id as string,
                        nombre: p.nombre,
                        apellido: p.apellido,
                        es_empresa: p.es_empresa,
                        razon_social: p.razon_social,
                        relacion: mp.tipo_relacion?.tipo || 'Desconocido',
                        activo: mp.activo,
                    }];
                })
            }];
        });
    };

    /**
     * Obtiene una mascota por su ID.
     * @param id - ID de la mascota
     * @returns Mascota encontrada o null
     */
    static async getById(id: string): Promise<MascotaPerfil | null> {
        const result = await db.query.mascotas.findFirst({
            where: eq(mascotas.id, id),
            with: {
                raza: {
                    with: {
                        especie: true,
                    }
                },
                mascotas_propietarios: {
                    with: {
                        propietario: {
                            columns: {
                                nombre: true,
                                apellido: true,
                                es_empresa: true,
                                razon_social: true,
                            }
                        },
                        tipo_relacion: {
                            columns: {
                                tipo: true,
                            }
                        }
                    }
                }
            }
        });
        if (!result) return null;
        return {
            id: result.id,
            nombre: result.nombre,
            foto_url: result.foto_url,
            edad: MascotaService.calcularEdad(result.fecha_nacimiento),
            fecha_nacimiento: result.fecha_nacimiento,
            sexo: result.sexo as 'M' | 'H',
            especie: result.raza.especie.especie,
            raza: result.raza.raza,
            es_castrado: result.es_castrado,
            numero_microchip: result.numero_microchip,
            propietarios: result.mascotas_propietarios.flatMap((mp) => {
                const p = mp.propietario;
                if (!p) return [];
                return [{
                    id: mp.propietario_id as string,
                    nombre: p.nombre,
                    apellido: p.apellido,
                    es_empresa: p.es_empresa,
                    razon_social: p.razon_social,
                    relacion: mp.tipo_relacion?.tipo || 'Desconocido',
                    activo: mp.activo,
                }];
            })
        }
    }

    /**
     * Crea una nueva mascota y opcionalmente la asocia con un propietario.
     * @param data - Datos de la nueva mascota
     * @param propietarioId - ID del propietario (opcional)
     * @param tipoRelacionId - ID del tipo de relación (opcional)
     * @param tx - Cliente de base de datos o transacción (opcional)
     * @returns La mascota creada
     */
    static async create(data: NewMascota, tx?: DBClient): Promise<MascotaDb> {
        const client = tx || db;

        const dateObject = new Date(data.fecha_nacimiento);
        data.fecha_nacimiento = dateObject;

        const [newMascota] = await client
            .insert(mascotas)
            .values(data)
            .returning();
        return newMascota;
    }

    /**
     * Actualiza una mascota existente.
     * @param id - ID de la mascota
     * @param data - Datos a actualizar
     * @param tx - Cliente de base de datos o transacción (opcional)
     * @returns La mascota actualizada o null
     */
    static async update(id: string, data: Partial<NewMascota>, tx?: DBClient): Promise<MascotaDb | null> {
        const client = tx || db;

        const [updated] = await client
            .update(mascotas)
            .set(data)
            .where(eq(mascotas.id, id))
            .returning();
        return updated || null;
    }

    /**
     * Asocia una mascota existente con un propietario.
     * @param mascotaId - ID de la mascota
     * @param propietarioId - ID del propietario
     * @param tipoRelacionId - ID del tipo de relación (opcional)
     * @param tx - Cliente de base de datos o transacción (opcional)
     */
    static async associateWithOwner(mascotaId: string, propietarioId: string, tipoRelacionId?: number, tx?: DBClient): Promise<void> {
        const client = tx || db;

        await client.insert(mascotas_propietarios).values({
            mascota_id: mascotaId,
            propietario_id: propietarioId,
            tipo_relacion_id: tipoRelacionId || null,
            activo: true,
        });
    }

    /**
     * Calcula la edad en años a partir de la fecha de nacimiento.
     * @param fechaNacimiento - Fecha de nacimiento de la mascota
     * @returns Edad en años
     */
    static calcularEdad(fechaNacimiento: Date): number {
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        const mesDiff = hoy.getMonth() - fechaNacimiento.getMonth();
        if (mesDiff < 0 || (mesDiff === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
            edad--;
        }
        return edad;
    }

    /**
     * Verifica si un propietario es dueño de una mascota.
     * @param proId - ID del propietario
     * @param mascotaId - ID de la mascota
     * @returns Booleano indicando si es dueño
     */
    static async isOwner(proId: string, mascotaId: string): Promise<boolean> {
        const result = await db.query.mascotas_propietarios.findFirst({
            where: and(
                eq(mascotas_propietarios.propietario_id, proId),
                eq(mascotas_propietarios.mascota_id, mascotaId),
                eq(mascotas_propietarios.activo, true)
            )
        });
        return !!result;
    }

    /**
     * Obtiene todas las mascotas que son pacientes de las clínicas asociadas a un veterinario.
     * @param vetId - ID del veterinario.
     * @returns Lista de mascotas (pacientes) del veterinario.
     */
    static async getAllMascotasByVeterinarioId(vetId: string): Promise<MascotaList[] | null> {
        const clinicaIds = await db.query.veterinarios_clinicas.findMany({
            where: and(
                eq(veterinarios_clinicas.veterinario_id, vetId),
                eq(veterinarios_clinicas.estado_activo, true)
            ),
            columns: {
                clinica_id: true
            }
        });

        if (!clinicaIds || clinicaIds.length === 0) return [];

        const ids = clinicaIds.map(c => c.clinica_id as string);

        const result = await db.query.clinicas_mascotas.findMany({
            where: and(
                inArray(clinicas_mascotas.clinica_id, ids),
                eq(clinicas_mascotas.estado_paciente_id, 2) // Activo
            ),
            with: {
                mascota: {
                    with: {
                        raza: {
                            with: {
                                especie: true
                            }
                        }
                    }
                }
            }
        });

        if (!result) return [];

        const seen = new Set<string>();
        const mapped: MascotaList[] = [];

        for (const relation of result) {
            const m = relation.mascota;
            if (!m || seen.has(m.id)) continue;
            seen.add(m.id);

            mapped.push({
                id: m.id,
                nombre: m.nombre,
                foto_url: m.foto_url,
                fecha_nacimiento: m.fecha_nacimiento,
                edad: MascotaService.calcularEdad(m.fecha_nacimiento),
                sexo: m.sexo as 'M' | 'H',
                especie: m.raza.especie.especie,
                raza: m.raza.raza,
                es_castrado: m.es_castrado,
                numero_microchip: m.numero_microchip,
            });
        }

        return mapped;
    }
}
