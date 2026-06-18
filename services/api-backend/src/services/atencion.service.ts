import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { atenciones, atenciones_diagnosticos, tratamientos, vacunas, citas, vacuna_protocolo, vacuna_serie, vacuna_dosis, catalogo_productos } from "../db/schema";
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
    vacunas: {
        producto_id: number;
        numero_lote: string;
        fecha_aplicacion: string;
        fecha_proxima_dosis?: string | null;
        iniciar_nueva_serie?: boolean;
        via_administracion: string;
    }[];
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

            // 4. Insertar vacunas en la nueva estructura (Protocolo -> Serie -> Dosis)
            if (input.vacunas && input.vacunas.length > 0) {
                for (const v of input.vacunas) {
                    const prodId = v.producto_id;
                    const fechaAplicacion = v.fecha_aplicacion ? new Date(v.fecha_aplicacion) : new Date();
                    const fechaProxima = v.fecha_proxima_dosis ? new Date(v.fecha_proxima_dosis) : null;

                    // Validaciones obligatorias
                    if (!v.numero_lote || !v.numero_lote.trim()) {
                        throw new Error(`El número de lote es obligatorio para la vacuna ID: ${prodId}`);
                    }
                    if (!v.via_administracion || !v.via_administracion.trim()) {
                        throw new Error(`La vía de administración es obligatoria para la vacuna ID: ${prodId}`);
                    }

                    // 4a. Buscar o crear el protocolo
                    let proto = await tx.query.vacuna_protocolo.findFirst({
                        where: eq(vacuna_protocolo.senasa_id, prodId)
                    });

                    if (!proto) {
                        const prod = await tx.query.catalogo_productos.findFirst({
                            where: eq(catalogo_productos.id, prodId)
                        });
                        const validez = new Date();
                        validez.setFullYear(validez.getFullYear() + 1);

                        const [newProto] = await tx.insert(vacuna_protocolo).values({
                            senasa_id: prodId,
                            numero_inscripcion: prod?.numero_senasa || 'MIGRADO',
                            nombre_comercial: prod?.nombre_comercial || 'Vacuna Creada',
                            observaciones: 'Creado automáticamente en consulta',
                            indicaciones_y_vias: 'Auto-creado',
                            especies_target: ['CANINOS', 'FELINOS'],
                            dosificacion_por_esp: {},
                            vias_administracion: ['SUBCUTANEA'],
                            fecha_validez: validez,
                            total_dosis_serie_primaria: 1,
                            intervalo_dias: [],
                            tiene_refuerzo: fechaProxima !== null,
                            refuerzo_cada_dias: fechaProxima ? 365 : null,
                        }).returning();
                        
                        if (!newProto) {
                            throw new Error("No se pudo crear el protocolo de vacuna");
                        }
                        proto = newProto;
                    }

                    // 4b. Buscar serie activa (en_curso o última completa si no se inicia nueva serie)
                    let serie = null;
                    if (!v.iniciar_nueva_serie) {
                        // Intentar buscar una serie 'en_curso'
                        serie = await tx.query.vacuna_serie.findFirst({
                            where: and(
                                eq(vacuna_serie.mascota_id, input.mascota_id),
                                eq(vacuna_serie.protocolo_id, prodId),
                                eq(vacuna_serie.estado_serie, 'en_curso')
                            )
                        });

                        // Si no hay serie en curso, y el protocolo tiene refuerzo, buscar la última completa para registrar refuerzo
                        if (!serie && proto.tiene_refuerzo) {
                            serie = await tx.query.vacuna_serie.findFirst({
                                where: and(
                                    eq(vacuna_serie.mascota_id, input.mascota_id),
                                    eq(vacuna_serie.protocolo_id, prodId),
                                    eq(vacuna_serie.estado_serie, 'completa')
                                ),
                                orderBy: (vs, { desc }) => [desc(vs.fecha_inicio)]
                            });
                        }
                    }

                    if (!serie) {
                        const totalDosis = proto.total_dosis_serie_primaria || 1;
                        const estado = (1 >= totalDosis) ? 'completa' : 'en_curso';

                        let proximoRefuerzo: Date | null = null;
                        if (estado === 'completa') {
                            if (fechaProxima) {
                                proximoRefuerzo = fechaProxima;
                            } else if (proto.tiene_refuerzo && proto.refuerzo_cada_dias) {
                                proximoRefuerzo = new Date(fechaAplicacion.getTime());
                                proximoRefuerzo.setDate(proximoRefuerzo.getDate() + proto.refuerzo_cada_dias);
                            }
                        }

                        const [newSerie] = await tx.insert(vacuna_serie).values({
                            protocolo_id: prodId,
                            mascota_id: input.mascota_id,
                            veterinario_id: input.veterinario_id,
                            fecha_inicio: fechaAplicacion,
                            estado_serie: estado,
                            dosis_aplicadas: 1,
                            proximo_refuerzo: proximoRefuerzo,
                        }).returning();

                        if (!newSerie) {
                            throw new Error("No se pudo crear la serie de vacuna");
                        }
                        serie = newSerie;

                        await tx.insert(vacuna_dosis).values({
                            serie_id: newSerie.id,
                            atencion_id: newAtencion.id,
                            numero_dosis: 1,
                            fecha_aplicacion: fechaAplicacion,
                            lote: v.numero_lote,
                            via_administracion: v.via_administracion,
                            observaciones: 'Registrado en consulta',
                        });
                    } else {
                        const numeroDosis = (serie.dosis_aplicadas || 0) + 1;
                        const totalDosis = proto.total_dosis_serie_primaria || 1;
                        
                        // Si ya estaba completa o alcanza el límite
                        const estado = (serie.estado_serie === 'completa' || numeroDosis >= totalDosis) ? 'completa' : 'en_curso';

                        let proximoRefuerzo: Date | null = null;
                        if (estado === 'completa') {
                            if (fechaProxima) {
                                proximoRefuerzo = fechaProxima;
                            } else if (proto.tiene_refuerzo && proto.refuerzo_cada_dias) {
                                proximoRefuerzo = new Date(fechaAplicacion.getTime());
                                proximoRefuerzo.setDate(proximoRefuerzo.getDate() + proto.refuerzo_cada_dias);
                            }
                        }

                        await tx.update(vacuna_serie)
                            .set({
                                dosis_aplicadas: numeroDosis,
                                estado_serie: estado,
                                proximo_refuerzo: proximoRefuerzo,
                            })
                            .where(eq(vacuna_serie.id, serie.id));

                        await tx.insert(vacuna_dosis).values({
                            serie_id: serie.id,
                            atencion_id: newAtencion.id,
                            numero_dosis: numeroDosis,
                            fecha_aplicacion: fechaAplicacion,
                            lote: v.numero_lote,
                            via_administracion: v.via_administracion,
                            observaciones: 'Registrado en consulta',
                        });
                    }
                }
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

    /**
     * Obtiene una atención detallada por su ID para reportes.
     */
    static async getById(id: string): Promise<any | null> {
        return await db.query.atenciones.findFirst({
            where: eq(atenciones.id, id),
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
            }
        });
    }
}

