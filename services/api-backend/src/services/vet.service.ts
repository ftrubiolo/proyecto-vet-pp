import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { veterinarios, veterinarios_clinicas, veterinarios_matriculados_cordoba } from "../db/schema";

export type VeterinarioClinica = typeof veterinarios_clinicas.$inferSelect;
export type Veterinario = typeof veterinarios.$inferSelect;
export type NewVeterinario = typeof veterinarios.$inferInsert;
type DBClient = typeof db | any;

/**
 * Servicio para la gestión de perfiles de veterinarios, habilitación de matrículas y asociaciones con clínicas.
 */
export class VetService {
    /**
     * Obtiene el veterinario por ID de perfil.
     * @param id - ID del perfil de veterinario
     * @returns Veterinario encontrado -> {@link Veterinario} o null si no existe
     */
    static async getById(id: string): Promise<Veterinario | null> {
        const result = await db.query.veterinarios.findFirst({
            where: eq(veterinarios.id, id),
        });
        if (!result) return null;
        return result;
    }

    /**
     * Obtiene el veterinario por ID de usuario.
     * @param usuarioId - ID del usuario
     * @returns Veterinario encontrado -> {@link Veterinario} o null si no existe
     */
    static async getByUsuarioId(usuarioId: string): Promise<Veterinario | null> {
        const result = await db.query.veterinarios.findFirst({
            where: eq(veterinarios.usuario_id, usuarioId),
        });
        if (!result) return null;
        return result;
    }

    /**
     * Crea un nuevo veterinario.
     * @param data - Datos del nuevo veterinario (insert type)
     * @param tx - Transacción de base de datos (opcional)
     * @returns El veterinario creado -> {@link Veterinario}
     */
    static async create(data: NewVeterinario, tx?: DBClient): Promise<Veterinario> {
        const client = tx || db;
        const [newVeterinario] = await client.insert(veterinarios).values(data).returning();
        return newVeterinario;
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
