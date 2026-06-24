import { db } from "../db";
import { and, eq, inArray, or, gt, isNull } from "drizzle-orm";
import { tratamientos, atenciones, catalogo_productos } from "../db/schema";
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

    /**
     * Obtiene un tratamiento detallado por su ID.
     */
    static async getById(id: string): Promise<any | null> {
        return await db.query.tratamientos.findFirst({
            where: eq(tratamientos.id, id),
            with: {
                tipo_tratamiento: true,
                producto: true,
                atencion: {
                    with: {
                        mascota: {
                            with: {
                                raza: {
                                    with: {
                                        especie: true
                                    }
                                },
                                mascotas_propietarios: {
                                    with: {
                                        propietario: true
                                    }
                                }
                            }
                        },
                        veterinario: {
                            with: {
                                usuario: {
                                    columns: {
                                        email: true,
                                    }
                                }
                            }
                        },
                        clinica: true,
                    }
                }
            }
        });
    }

    /**
     * Busca pacientes activos del veterinario por nombre de producto (vademécum SENASA).
     * Filtra por clínicas del vet y tratamientos activos.
     */
    static async searchPacientesByProducto(query: string, clinicaIds: string[]): Promise<{ matchingProducts: any[]; treatments: any[] }> {
        const allProducts = await db.query.catalogo_productos.findMany();
        const q = query.toLowerCase();
        const matchingProducts = allProducts.filter(p =>
            p.nombre_comercial.toLowerCase().includes(q)
        ).slice(0, 5);

        if (matchingProducts.length === 0) {
            return { matchingProducts: [], treatments: [] };
        }

        const productIds = matchingProducts.map((p: any) => p.id);
        const atencionSubquery = db
            .select({ id: atenciones.id })
            .from(atenciones)
            .where(inArray(atenciones.clinica_id, clinicaIds));

        const now = new Date();
        const treatments = await db.query.tratamientos.findMany({
            where: and(
                inArray(tratamientos.producto_id, productIds),
                inArray(tratamientos.atencion_id, atencionSubquery),
                or(isNull(tratamientos.fecha_fin), gt(tratamientos.fecha_fin, now))
            ),
            with: {
                atencion: {
                    with: {
                        mascota: { columns: { id: true, nombre: true } }
                    }
                },
                producto: { columns: { id: true, nombre_comercial: true } }
            }
        }) as any[];

        return { matchingProducts, treatments };
    }

    /**
     * Obtiene los tratamientos activos de una mascota (sin fecha_fin o con fecha_fin futura).
     * @param mascotaId - ID de la mascota
     * @returns Array de tratamientos activos
     */
    static async getActivosByMascotaId(mascotaId: string): Promise<any[]> {
        const subquery = db
            .select({ id: atenciones.id })
            .from(atenciones)
            .where(eq(atenciones.mascota_id, mascotaId));

        const now = new Date();
        return await db.query.tratamientos.findMany({
            where: and(
                inArray(tratamientos.atencion_id, subquery),
                or(
                    isNull(tratamientos.fecha_fin),
                    gt(tratamientos.fecha_fin, now)
                )
            ),
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
}

