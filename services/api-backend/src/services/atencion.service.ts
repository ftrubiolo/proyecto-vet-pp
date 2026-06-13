import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { atenciones, atenciones_diagnosticos, tratamientos, vacunas, citas } from "../db/schema";
import type { NewAtencion, NewTratamiento, NewVacuna } from "../types/db.types";

export interface AtencionInput {
    cita_id?: string | null;
    mascota_id: string;
    veterinario_id: string;
    clinica_id: string;
    notas_clinicas: string;
    peso_actual?: string | null;
    diagnosticos: number[]; // IDs de diagnosticos_atencion
    tratamientos: Omit<NewTratamiento, "atencion_id">[];
    vacunas: Omit<NewVacuna, "atencion_id" | "mascota_id" | "veterinario_id">[];
}

/**
 * Servicio para manejar las atenciones de las mascotas.
 */
export class AtencionService {
    /**
     * Obtiene todas las atenciones de una mascota ordenadas por fecha descendente.
     * @param mascotaId - ID de la mascota
     * @returns Array de atenciones
     */
    static async getByMascotaId(mascotaId: string): Promise<any[]> {
        return await db.query.atenciones.findMany({
            where: eq(atenciones.mascota_id, mascotaId),
            with: {
                veterinario: {
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
                        }
                    }
                },
                clinica: {
                    columns: {
                        id: true,
                        nombre_comercial: true,
                        telefono: true,
                        direccion: true,
                    }
                },
                atenciones_diagnosticos: {
                    with: {
                        diagnostico: true
                    }
                },
                tratamientos: {
                    with: {
                        tipo_tratamiento: true,
                        producto: true,
                    }
                }
            },
            orderBy: (atenciones, { desc }) => [desc(atenciones.fecha_atencion)],
        }) as any[];
    }

    /**
     * Crea un nuevo registro de atención.
     * @param input - Datos de la atención
     * @returns Objeto de atención creado
     */
    static async create(input: AtencionInput): Promise<any> {
        return await db.transaction(async (tx) => {
            // 1. Crear registro de atención
            const [newAtencion] = await tx.insert(atenciones).values({
                cita_id: input.cita_id || null,
                mascota_id: input.mascota_id,
                veterinario_id: input.veterinario_id,
                clinica_id: input.clinica_id,
                notas_clinicas: input.notas_clinicas,
                peso_actual: input.peso_actual || null,
            }).returning();

            // 2. Insertar diagnósticos
            if (input.diagnosticos && input.diagnosticos.length > 0) {
                const diagValues = input.diagnosticos.map(diagId => ({
                    atencion_id: newAtencion.id,
                    diagnostico_id: diagId,
                }));
                await tx.insert(atenciones_diagnosticos).values(diagValues);
            }

            // 3. Insertar tratamientos
            if (input.tratamientos && input.tratamientos.length > 0) {
                const treatValues = input.tratamientos.map(t => ({
                    tipo_id: (t as any).tipo_tratamiento_id || t.tipo_id,
                    producto_id: t.producto_id,
                    dosis: t.dosis,
                    frecuencia: t.frecuencia,
                    fecha_inicio: t.fecha_inicio ? new Date(t.fecha_inicio) : new Date(),
                    fecha_fin: t.fecha_fin ? new Date(t.fecha_fin) : null,
                    indicaciones_adicionales: t.indicaciones_adicionales,
                    atencion_id: newAtencion.id,
                }));
                await tx.insert(tratamientos).values(treatValues);
            }

            // 4. Insertar vacunas
            if (input.vacunas && input.vacunas.length > 0) {
                const vaccineValues = input.vacunas.map(v => ({
                    ...v,
                    atencion_id: newAtencion.id,
                    mascota_id: input.mascota_id,
                    veterinario_id: input.veterinario_id,
                    fecha_aplicacion: v.fecha_aplicacion ? new Date(v.fecha_aplicacion) : new Date(),
                    fecha_proxima_dosis: v.fecha_proxima_dosis ? new Date(v.fecha_proxima_dosis) : null,
                }));
                await tx.insert(vacunas).values(vaccineValues);
            }

            // 5. Si viene de una cita, actualizar el estado de la cita a Confirmada (o mantener)
            if (input.cita_id) {
                // Opcional: Podríamos marcar la cita como confirmada o simplemente dejarla.
                // Como no hay un estado 'Completada', relacionarla con la atencion ya indica completitud.
                // Pero si estaba 'Agendada' (Pendiente), podemos pasarla a 'Confirmada'.
                await tx.update(citas)
                    .set({ estado_cita_id: 2 }) // 2 = Confirmada
                    .where(eq(citas.id, input.cita_id));
            }

            return newAtencion;
        });
    }
}
