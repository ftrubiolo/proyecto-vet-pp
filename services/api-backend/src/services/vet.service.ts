import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { veterinarios, veterinarios_clinicas, veterinarios_matriculados_cordoba } from "../db/schema";


/**
 * Servicio para la gestión de perfiles de veterinarios, habilitación de matrículas y asociaciones con clínicas.
 */
export class VetService {
    /**
     * Obtiene el veterinario por ID de perfil.
     * @param id - ID del perfil de veterinario
     * @returns Veterinario encontrado
     */
    static async getById(id: string) {
        return db.query.veterinarios.findFirst({
            where: eq(veterinarios.id, id),
        });
    }

    /**
     * Obtiene el veterinario por ID de usuario.
     * @param userId - ID del usuario
     * @returns Veterinario encontrado
     */
    static async getByUserId(userId: string) {
        return db.query.veterinarios.findFirst({
            where: eq(veterinarios.usuario_id, userId),
        });
    }

    /**
     * Obtiene la asociación de un veterinario con una clínica.
     * @param vetId - ID del veterinario
     * @param clinicId - ID de la clínica
     * @returns Asociación de veterinario con clínica
     */
    static async getAssociationWithClinic(vetId: string, clinicId: string) {
        return db.query.veterinarios_clinicas.findFirst({
            where: and(
                eq(veterinarios_clinicas.veterinario_id, vetId),
                eq(veterinarios_clinicas.clinica_id, clinicId),
                eq(veterinarios_clinicas.estado_activo, true),
            ),
        });
    }

    /**
     * Verifica si la licencia/matrícula existe y es válida en la base de datos.
     * @param licenseNumber - Número de matrícula/licencia a verificar
     * @returns true si es válida, false en caso contrario
     */
    static async isValidLicense(licenseNumber: string): Promise<boolean> {
        const result = await db.query.veterinarios_matriculados_cordoba.findFirst({
            where: and(
                eq(veterinarios_matriculados_cordoba.numero_matricula, licenseNumber),
                eq(veterinarios_matriculados_cordoba.es_valido, true)
            )
        });
        return !!result;
    }

    /**
     * Verifica si un veterinario ya está registrado en la base de datos.
     * @param userId - ID del usuario a verificar
     * @returns true si el veterinario está registrado, false en caso contrario
     */
    static async existsByUserId(userId: string): Promise<boolean> {
        const user = await this.getByUserId(userId);
        return !!user;
    }
}
