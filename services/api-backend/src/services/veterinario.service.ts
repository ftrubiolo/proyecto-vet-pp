import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { veterinarios, veterinarios_clinicas, veterinarios_matriculados_cordoba, usuarios } from "../db/schema";
import { DBClient, NewVeterinario, UpdateVeterinario, VeterinarioClinicaDb, VeterinarioDb } from "../types/db.types";
import { VeterinarioList, VeterinarioPerfil } from "../types/veterinario.types";

/**
 * Servicio para la gestión de perfiles de veterinarios, habilitación de matrículas y asociaciones con clínicas.
 */
export class VetService {

    /**
     * Obtiene todos los veterinarios con sus datos de usuario y clínicas.
     * @returns Array de veterinarios -> {@link Veterinario}
     */
    static async getAll(): Promise<VeterinarioList[]> {
        const result = await db.query.veterinarios.findMany({
            columns: {
                id: true,
                nombre: true,
                apellido: true,
                telefono: true,
            },
            with: {
                usuario: {
                    columns: {
                        email: true,
                    }
                },
            }
        });
        if (!result) return [];
        return result.map((v) => ({
            id: v.id,
            nombre: v.nombre,
            apellido: v.apellido,
            email: v.usuario.email,
            telefono: v.telefono,
        }));
    }

    /**
     * Obtiene el veterinario por ID de perfil.
     * @param id - ID del perfil de veterinario
     * @returns Veterinario encontrado -> {@link Veterinario} o null si no existe
     */
    static async getById(id: string): Promise<VeterinarioPerfil | null> {
        const result = await db.query.veterinarios.findFirst({
            where: eq(veterinarios.id, id),
            with: {
                usuario: {
                    columns: {
                        email: true,
                        fecha_creacion: true,
                    }
                },
                veterinarios_clinicas: {
                    where: eq(veterinarios_clinicas.estado_activo, true),
                    columns: {},
                    with: {
                        clinica: {
                            columns: {
                                id: true,
                                nombre_comercial: true,
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
            apellido: result.apellido,
            email: result.usuario.email,
            numero_matricula: result.numero_matricula,
            foto_url: result.foto_url,
            telefono: result.telefono,
            fecha_creacion: result.usuario.fecha_creacion,
            clinicas: result.veterinarios_clinicas.flatMap((vc) => {
                const c = vc.clinica;
                if (!c) return [];
                return [{
                    id: c.id,
                    nombre_comercial: c.nombre_comercial,
                }]
            }),
        };
    }

    /**
     * Obtiene el veterinario por ID de usuario.
     * @param usuarioId - ID del usuario
     * @returns Veterinario encontrado -> {@link Veterinario} o null si no existe
     */
    static async getByUsuarioId(usuarioId: string): Promise<VeterinarioPerfil | null> {
        const result = await db.query.veterinarios.findFirst({
            where: eq(veterinarios.usuario_id, usuarioId),
            with: {
                usuario: {
                    columns: {
                        email: true,
                        fecha_creacion: true,
                    }
                },
                veterinarios_clinicas: {
                    where: eq(veterinarios_clinicas.estado_activo, true),
                    columns: {},
                    with: {
                        clinica: {
                            columns: {
                                id: true,
                                nombre_comercial: true,
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
            apellido: result.apellido,
            email: result.usuario.email,
            numero_matricula: result.numero_matricula,
            foto_url: result.foto_url,
            telefono: result.telefono,
            fecha_creacion: result.usuario.fecha_creacion,
            clinicas: result.veterinarios_clinicas.flatMap((vc) => {
                const c = vc.clinica;
                if (!c) return [];
                return [{
                    id: c.id,
                    nombre_comercial: c.nombre_comercial,
                }]
            }),
        };
    }

    /**
     * Crea un nuevo veterinario.
     * @param data - Datos del nuevo veterinario (insert type)
     * @param tx - Transacción de base de datos (opcional)
     * @returns El veterinario creado -> {@link VeterinarioDb}
     */
    static async create(data: NewVeterinario, tx?: DBClient): Promise<VeterinarioDb> {
        const client = tx || db;
        const [newVeterinario] = await client.insert(veterinarios).values(data).returning();

        return newVeterinario as VeterinarioDb;
    }

    /**
     * Actualiza un veterinario.
     * @param id - ID del veterinario
     * @param data - Datos del veterinario
     * @param tx - Transacción de base de datos (opcional)
     * @returns El veterinario actualizado -> {@link VeterinarioDb} o null si no existe
     */
    static async update(id: string, data: UpdateVeterinario, tx?: DBClient): Promise<VeterinarioDb | null> {
        const client = tx || db;
        const [updated] = await client.update(veterinarios)
            .set(data)
            .where(eq(veterinarios.id, id))
            .returning();
        return updated || null;
    }

    /**
     * Asocia un veterinario con una clínica.
     * @param vetId - ID del veterinario
     * @param clinicaId - ID de la clínica
     * @param tx - Transacción de base de datos (opcional)
     */
    static async associateWithClinica(vetId: string, clinicaId: string, tx?: DBClient) {
        const client = tx || db;
        await client.insert(veterinarios_clinicas).values({
            veterinario_id: vetId,
            clinica_id: clinicaId,
        });
    }

    /**
     * Obtiene la asociación de un veterinario con una clínica.
     * @param vetId - ID del veterinario
     * @param clinicaId - ID de la clínica
     * @returns Asociación de veterinario con clínica -> {@link VeterinarioClinica} o null si no existe
     */
    static async getAssociationWithClinica(vetId: string, clinicaId: string): Promise<VeterinarioClinicaDb | null> {
        const result = await db.query.veterinarios_clinicas.findFirst({
            where: and(
                eq(veterinarios_clinicas.veterinario_id, vetId),
                eq(veterinarios_clinicas.clinica_id, clinicaId),
                eq(veterinarios_clinicas.estado_activo, true),
            ),
        });
        if (!result) return null
        return {
            veterinario_id: result.veterinario_id as string,
            clinica_id: result.clinica_id as string,
            estado_activo: !!result.estado_activo,
        }
    }

    /**
     * Verifica si la matrícula existe y es válida en la base de datos.
     * @param matricula - Número de matrícula a verificar
     * @returns true si es válida, false en caso contrario
     */
    static async isValidMatricula(matricula: string): Promise<boolean> {
        const result = await db.query.veterinarios_matriculados_cordoba.findFirst({
            where: and(
                eq(veterinarios_matriculados_cordoba.numero_matricula, matricula),
                eq(veterinarios_matriculados_cordoba.es_valido, true)
            )
        });
        return !!result;
    }

    /**
     * Verifica si un veterinario ya está registrado en la base de datos.
     * @param usuarioId - ID del usuario a verificar
     * @returns true si el veterinario está registrado, false en caso contrario
     */
    static async existsByUsuarioId(usuarioId: string): Promise<boolean> {
        const vet = await this.getByUsuarioId(usuarioId);
        return !!vet;
    }
}
