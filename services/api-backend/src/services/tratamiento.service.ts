import { db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { tratamientos, atenciones } from "../db/schema";
import type { UpdateTratamiento, TratamientoDb } from "../types/db.types";

/**
 * Servicio para manejar los tratamientos de las mascotas.
 */
export class TratamientoService {
    /**
     * Obtiene todos los tratamientos de una mascota.
     * @param mascotaId - ID de la mascota
     * @returns Array de tratamientos
     */
    static async getByMascotaId(mascotaId: string): Promise<any[]> {
        const subquery = db
            .select({ id: atenciones.id })
            .from(atenciones)
            .where(eq(atenciones.mascota_id, mascotaId));

        return await db.query.tratamientos.findMany({
            where: inArray(tratamientos.atencion_id, subquery),
            with: {
                tipo_tratamiento: true,
                producto: true,
                atencion: {
                    with: {
                        veterinario: {
                            columns: {
                                nombre: true,
                                apellido: true,
                            }
                        }
                    }
                }
            }
        }) as any[];
    }

    /**
     * Actualiza un tratamiento.
     * @param id - ID del tratamiento
     * @param data - Datos del tratamiento a actualizar
     * @returns Objeto del tratamiento actualizado
     */
    static async update(id: string, data: UpdateTratamiento): Promise<TratamientoDb | null> {
        if (data.fecha_inicio) {
            data.fecha_inicio = new Date(data.fecha_inicio);
        }
        if (data.fecha_fin) {
            data.fecha_fin = new Date(data.fecha_fin);
        }
        const [updated] = await db
            .update(tratamientos)
            .set(data)
            .where(eq(tratamientos.id, id))
            .returning();
        return updated || null;
    }
}
