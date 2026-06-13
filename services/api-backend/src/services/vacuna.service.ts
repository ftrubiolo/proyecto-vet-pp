import { db } from "../db";
import { eq } from "drizzle-orm";
import { vacunas } from "../db/schema";

/**
 * Servicio para manejar las vacunas de las mascotas.
 */
export class VacunaService {
    /**
     * Obtiene todas las vacunas de una mascota.
     * @param mascotaId - ID de la mascota
     * @returns Array de vacunas
     */
    static async getByMascotaId(mascotaId: string): Promise<any[]> {
        return await db.query.vacunas.findMany({
            where: eq(vacunas.mascota_id, mascotaId),
            with: {
                producto: true
            }
        }) as any[];
    }
}
