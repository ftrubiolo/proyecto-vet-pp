import { db } from "../db";
import { eq } from "drizzle-orm";
import { mascotas, mascotas_propietarios } from "../db/schema";

import type { MascotaDb, NewMascota, DBClient } from '../types/db.types';

export interface MascotaResumen {
    id: string;
    nombre: string;
    foto_url?: string | null;
    edad: number;
    sexo: 'M' | 'H';
    especie: string;
    raza: string;
    esterilizado: boolean;
    activo: boolean;
}

export interface PropietarioResumen {
    id: string;
    nombre: string;
    apellido: string;
    tipo_relacion: string;
    activo: boolean;
}

export interface PerfilMascota {
    id: string;
    nombre: string;
    foto_url?: string | null;
    edad: number;
    fecha_nacimiento: Date;
    sexo: 'M' | 'H';
    especie: string;
    raza: string;
    esterilizado: boolean;
    propietarios: PropietarioResumen[];
}

/**
 * Servicio para la gestión de mascotas (pacientes).
 */
export class MascotaService {

    static async getAllMascotasByPropietarioId(propietarioId: string): Promise<PerfilMascota[] | null> {
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
                esterilizado: m.es_castrado,
                propietarios: m.mascotas_propietarios.flatMap((mp) => {
                    const p = mp.propietario;
                    if (!p) return [];
                    return [{
                        id: mp.propietario_id as string,
                        nombre: p.nombre,
                        apellido: p.apellido,
                        tipo_relacion: mp.tipo_relacion?.tipo || 'Desconocido',
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
    static async getById(id: string): Promise<PerfilMascota | null> {
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
            esterilizado: result.es_castrado,
            propietarios: result.mascotas_propietarios.flatMap((mp) => {
                const p = mp.propietario;
                if (!p) return [];
                return [{
                    id: mp.propietario_id as string,
                    nombre: p.nombre,
                    apellido: p.apellido,
                    tipo_relacion: mp.tipo_relacion?.tipo || 'Desconocido',
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
    static async create(data: NewMascota, propietarioId?: string, tipoRelacionId?: number, tx?: DBClient): Promise<MascotaDb> {
        const client = tx || db;

        return await client.transaction(async (transactionClient: any) => {
            const [newMascota] = await transactionClient
                .insert(mascotas)
                .values(data)
                .returning();

            if (propietarioId) {
                await transactionClient.insert(mascotas_propietarios).values({
                    mascota_id: newMascota.id,
                    propietario_id: propietarioId,
                    tipo_relacion_id: tipoRelacionId || null,
                    activo: true,
                });
            }

            return newMascota;
        });
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
}
