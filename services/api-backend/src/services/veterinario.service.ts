import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { veterinarios, veterinarios_clinicas, veterinarios_matriculados_cordoba, usuarios } from "../db/schema";
import { UpdateVeterinario } from "../types/db.types";

export type VeterinarioClinica = typeof veterinarios_clinicas.$inferSelect;
export interface Veterinario {
    id: string;
    usuario_id: string;
    nombre: string;
    apellido: string;
    email: string;
    foto_url?: string | null;
    telefono?: string | null;
    clinicas: string[];
    fecha_creacion: Date;
}
export type NewVeterinario = typeof veterinarios.$inferInsert;
export type VeterinarioDb = typeof veterinarios.$inferSelect
type DBClient = typeof db | any;

/**
 * Servicio para la gestión de perfiles de veterinarios, habilitación de matrículas y asociaciones con clínicas.
 */
export class VetService {

    /**
     * Obtiene todos los veterinarios con sus datos de usuario y clínicas.
     * @returns Array de veterinarios -> {@link Veterinario}
     */
    static async getAll(): Promise<Veterinario[]> {
        const result = await db.query.veterinarios.findMany({
            with: {
                usuario: {
                    columns: {
                        email: true,
                        fecha_creacion: true,
                    }
                },
                veterinarios_clinicas: {
                    columns: {
                        clinica_id: true,
                    }
                }
            }
        });
        if (!result) return [];
        return result.map((vc) => ({
            id: vc.id,
            usuario_id: vc.usuario_id,
            nombre: vc.nombre,
            apellido: vc.apellido,
            email: vc.usuario.email,
            foto_url: vc.foto_url,
            telefono: vc.telefono,
            clinicas: vc.veterinarios_clinicas.map((vc) => vc.clinica_id as string),
            fecha_creacion: vc.usuario.fecha_creacion,
        }));
    }

    /**
     * Obtiene el veterinario por ID de perfil.
     * @param id - ID del perfil de veterinario
     * @returns Veterinario encontrado -> {@link Veterinario} o null si no existe
     */
    static async getById(id: string): Promise<Veterinario | null> {
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
                    columns: {
                        clinica_id: true,
                    }
                }
            }
        });
        if (!result) return null;
        return {
            id: result.id,
            usuario_id: result.usuario_id,
            nombre: result.nombre,
            apellido: result.apellido,
            email: result.usuario.email,
            foto_url: result.foto_url,
            telefono: result.telefono,
            clinicas: result.veterinarios_clinicas.map((vc) => vc.clinica_id as string),
            fecha_creacion: result.usuario.fecha_creacion,
        };
    }

    /**
     * Obtiene el veterinario por ID de usuario.
     * @param usuarioId - ID del usuario
     * @returns Veterinario encontrado -> {@link Veterinario} o null si no existe
     */
    static async getByUsuarioId(usuarioId: string): Promise<Veterinario | null> {
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
                    columns: {
                        clinica_id: true,
                    }
                }
            }
        });
        if (!result) return null;
        return {
            id: result.id,
            usuario_id: result.usuario_id,
            nombre: result.nombre,
            apellido: result.apellido,
            email: result.usuario.email,
            foto_url: result.foto_url,
            telefono: result.telefono,
            clinicas: result.veterinarios_clinicas.map((vc) => vc.clinica_id as string),
            fecha_creacion: result.usuario.fecha_creacion,
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
    static async getAssociationWithClinica(vetId: string, clinicaId: string): Promise<VeterinarioClinica | null> {
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
