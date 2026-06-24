import type { TokenPayload } from "@vetvault/shared";
import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";
import { and, eq, inArray, lt, or } from "drizzle-orm";
import { db } from "../../db";
import { catalogo_productos, vacuna_serie } from "../../db/schema";
import { Validation } from "../../utils/validation";
import { CitaService } from "../cita.service";
import { AtencionService } from "../atencion.service";
import { VacunaService } from "../vacuna.service";
import { HorarioService } from "../horario.service";
import { VetService } from "../veterinario.service";
import { MascotaService } from "../mascota.service";
import { PropietarioService } from "../propietario.service";
import { TratamientoService } from "../tratamiento.service";

export interface Tool {
    declaration: FunctionDeclaration;
    handler: (args: Record<string, unknown>, user: TokenPayload) => Promise<object>;
}

export const tools: Tool[] = [
    {
        declaration: {
            name: "schedule_appointment",
            description: "Registra una cita o turno médico en el sistema para una mascota en una clínica específica.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    mascotaId: { type: SchemaType.STRING, description: "El ID (UUID) de la mascota" },
                    clinicaId: { type: SchemaType.STRING, description: "El ID (UUID) de la clínica donde se atenderá" },
                    fechaHora: { type: SchemaType.STRING, description: "La fecha y hora propuesta en formato ISO 8601 (ej. 2026-06-20T10:00:00Z)" },
                    motivoId: { type: SchemaType.INTEGER, description: "El ID del motivo de la cita: 1 = Consulta General, 2 = Vacunación, 3 = Urgencia, 4 = Control" }
                },
                required: ["mascotaId", "clinicaId", "fechaHora", "motivoId"]
            }
        },
        handler: async (args, user) => {
            const { mascotaId, clinicaId, fechaHora, motivoId } = args as { mascotaId: string; clinicaId: string; fechaHora: string; motivoId: number };

            const hasAccess = await Validation.hasAccessMascota(user, mascotaId);
            if (!hasAccess) {
                return { error: "Acceso denegado: No posees permisos de acceso a la mascota especificada." };
            }

            const appointmentData: any = {
                mascota_id: mascotaId,
                clinica_id: clinicaId,
                fecha_hora: new Date(fechaHora),
                motivo_id: motivoId,
                estado_cita_id: 1
            };

            if (user.rol === "Veterinario" && user.vetId) {
                appointmentData.veterinario_id = user.vetId;
            }

            const newCita = await CitaService.create(appointmentData);
            return {
                status: "success",
                message: "Cita médica programada con éxito",
                citaId: newCita.id,
                fechaHora: newCita.fecha_hora
            };
        }
    },
    {
        declaration: {
            name: "search_vademecum",
            description: "Busca un producto, medicamento o vacuna en el vademécum de SENASA por coincidencia de nombre o firma.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: { type: SchemaType.STRING, description: "Término de búsqueda del medicamento" }
                },
                required: ["query"]
            }
        },
        handler: async (args) => {
            const { query } = args as { query: string };
            const allProducts = await db.query.catalogo_productos.findMany();
            const q = query.toLowerCase();
            const filtered = allProducts.filter(p =>
                p.nombre_comercial.toLowerCase().includes(q) ||
                p.nombre_firma.toLowerCase().includes(q) ||
                p.numero_senasa.toLowerCase().includes(q)
            ).slice(0, 8);

            return { status: "success", count: filtered.length, products: filtered };
        }
    },
    {
        declaration: {
            name: "get_medical_history",
            description: "Permite consultar el historial médico y las notas clínicas detalladas de una mascota específica si no están cargadas.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    mascotaId: { type: SchemaType.STRING, description: "El ID (UUID) de la mascota" }
                },
                required: ["mascotaId"]
            }
        },
        handler: async (args, user) => {
            const { mascotaId } = args as { mascotaId: string };

            const hasAccess = await Validation.hasAccessMascota(user, mascotaId);
            if (!hasAccess) {
                return { error: "Acceso denegado: No tienes permisos para ver el historial clínico de esta mascota." };
            }

            const historyList = await AtencionService.getByMascotaId(mascotaId);
            return {
                status: "success",
                history: historyList.map((h: any) => ({
                    fecha: h.fecha_atencion,
                    peso: h.peso_actual,
                    notas: h.notas_clinicas,
                    diagnosticos: h.atenciones_diagnosticos?.map((d: any) => d.diagnostico?.diagnostico),
                    tratamientos: h.tratamientos?.map((t: any) => ({
                        tipo: t.tipo_tratamiento?.tipo,
                        medicamento: t.producto?.nombre_comercial,
                        dosis: t.dosis,
                        frecuencia: t.frecuencia
                    }))
                }))
            };
        }
    },
    {
        declaration: {
            name: "get_my_appointments",
            description: "Obtiene la lista de citas del veterinario autenticado en un rango de fechas. Incluye datos del paciente, motivo y estado.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    fechaInicio: {
                        type: SchemaType.STRING,
                        description: "Fecha inicio ISO 8601 (ej. 2026-06-25T00:00:00Z). Default: inicio de hoy."
                    },
                    fechaFin: {
                        type: SchemaType.STRING,
                        description: "Fecha fin ISO 8601 (ej. 2026-06-25T23:59:59Z). Default: fin de hoy."
                    }
                },
                required: []
            }
        },
        handler: async (args, user) => {
            if (user.rol !== "Veterinario" || !user.vetId) {
                return { error: "Solo los veterinarios pueden consultar sus citas." };
            }

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfDay = new Date(startOfDay.getTime() + 86400000 - 1);

            const fechaInicio = args.fechaInicio ? new Date(args.fechaInicio as string) : startOfDay;
            const fechaFin = args.fechaFin ? new Date(args.fechaFin as string) : endOfDay;

            const citas = await CitaService.getByVeterinarioId(user.vetId, { start: fechaInicio, end: fechaFin });

            if (!citas || citas.length === 0) {
                return { status: "success", count: 0, message: "No hay citas en el rango solicitado.", appointments: [] };
            }

            return {
                status: "success",
                count: citas.length,
                appointments: citas.map((c: any) => ({
                    id: c.id,
                    mascota: c.mascota?.nombre || "Sin nombre",
                    motivo: c.motivo_cita?.motivo || "General",
                    estado: c.estado_cita?.estado || "Desconocido",
                    fechaHora: c.fecha_hora,
                    clinica: c.clinica?.nombre_comercial || "",
                    veterinario: c.veterinario ? `${c.veterinario.nombre} ${c.veterinario.apellido}` : ""
                }))
            };
        }
    },
    {
        declaration: {
            name: "reschedule_appointment",
            description: "Cambia la fecha y hora de una cita existente. Solo el veterinario asignado o un admin puede reprogramar.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    citaId: { type: SchemaType.STRING, description: "El ID (UUID) de la cita a reprogramar" },
                    nuevaFechaHora: { type: SchemaType.STRING, description: "Nueva fecha y hora ISO 8601 (ej. 2026-06-28T15:30:00Z)" }
                },
                required: ["citaId", "nuevaFechaHora"]
            }
        },
        handler: async (args, user) => {
            const { citaId, nuevaFechaHora } = args as { citaId: string; nuevaFechaHora: string };

            const existingCita = await CitaService.getById(citaId);
            if (!existingCita) {
                return { error: "La cita especificada no existe." };
            }

            if (user.rol !== "Admin" && user.vetId !== existingCita.veterinario_id) {
                return { error: "No tienes permiso para reprogramar esta cita." };
            }

            const updated = await CitaService.update(citaId, {
                fecha_hora: new Date(nuevaFechaHora),
                estado_cita_id: 1
            });

            return {
                status: "success",
                message: "Cita reprogramada con éxito",
                citaId: updated?.id,
                nuevaFechaHora: updated?.fecha_hora
            };
        }
    },
    {
        declaration: {
            name: "cancel_appointment",
            description: "Cancela una cita existente cambiando su estado a Cancelada.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    citaId: { type: SchemaType.STRING, description: "El ID (UUID) de la cita a cancelar" }
                },
                required: ["citaId"]
            }
        },
        handler: async (args, user) => {
            const { citaId } = args as { citaId: string };

            const existingCita = await CitaService.getById(citaId);
            if (!existingCita) {
                return { error: "La cita especificada no existe." };
            }

            if (user.rol !== "Admin" && user.vetId !== existingCita.veterinario_id) {
                return { error: "No tienes permiso para cancelar esta cita." };
            }

            await CitaService.update(citaId, { estado_cita_id: 3 });

            return {
                status: "success",
                message: "Cita cancelada con éxito"
            };
        }
    },
    {
        declaration: {
            name: "check_availability",
            description: "Consulta los horarios disponibles (slots de 30 min) del veterinario. Si no se especifica clínica, consulta todas las del veterinario. Si no se especifica fecha, usa mañana.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    clinicaId: { type: SchemaType.STRING, description: "El ID (UUID) de la clínica. Opcional: si se omite, consulta todas las clínicas del veterinario." },
                    fecha: { type: SchemaType.STRING, description: "La fecha en formato YYYY-MM-DD. Opcional: si se omite, usa la fecha de mañana." }
                },
                required: []
            }
        },
        handler: async (args, user) => {
            if (user.rol !== "Veterinario" || !user.vetId) {
                return { error: "Solo los veterinarios pueden consultar disponibilidad." };
            }

            const manana = new Date();
            manana.setDate(manana.getDate() + 1);
            const defaultFecha = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;

            const fecha = (args.fecha as string) || defaultFecha;
            const clinicaId = args.clinicaId as string | undefined;

            if (clinicaId) {
                const slots = await HorarioService.calcularDisponibilidad(clinicaId, user.vetId, fecha);
                return {
                    status: "success",
                    fecha,
                    clinicaId,
                    slotsDisponibles: slots,
                    totalSlots: slots.length
                };
            }

            const clinicaIds = await VetService.getClinicasByVeterinarioId(user.vetId);
            if (!clinicaIds || clinicaIds.length === 0) {
                return { status: "success", fecha, message: "No estás asociado a ninguna clínica.", disponibilidad: [] };
            }

            const results = [];
            for (const cId of clinicaIds) {
                const slots = await HorarioService.calcularDisponibilidad(cId, user.vetId, fecha);
                results.push({ clinicaId: cId, slotsDisponibles: slots, totalSlots: slots.length });
            }

            return { status: "success", fecha, disponibilidad: results };
        }
    },
    {
        declaration: {
            name: "get_vaccination_status",
            description: "Obtiene el estado completo de vacunación de una mascota: series activas, dosis aplicadas, próximos refuerzos.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    mascotaId: { type: SchemaType.STRING, description: "El ID (UUID) de la mascota" }
                },
                required: ["mascotaId"]
            }
        },
        handler: async (args, user) => {
            const { mascotaId } = args as { mascotaId: string };

            const hasAccess = await Validation.hasAccessMascota(user, mascotaId);
            if (!hasAccess) {
                return { error: "Acceso denegado: No tienes permiso para ver la información de vacunación de esta mascota." };
            }

            const series = await VacunaService.getByMascotaId(mascotaId);

            if (!series || series.length === 0) {
                return { status: "success", message: "Esta mascota no tiene registros de vacunación en el sistema.", series: [] };
            }

            return {
                status: "success",
                series: series.map((s: any) => ({
                    id: s.id,
                    vacuna: s.protocolo?.nombre_comercial || "No especificada",
                    estado: s.estado_serie,
                    fechaInicio: s.fecha_inicio,
                    dosisAplicadas: s.dosis_aplicadas,
                    proximoRefuerzo: s.proximo_refuerzo,
                    dosis: s.dosis?.map((d: any) => ({
                        numero: d.numero_dosis,
                        fecha: d.fecha_aplicacion,
                        lote: d.lote,
                        via: d.via_administracion
                    }))
                }))
            };
        }
    },
    {
        declaration: {
            name: "find_patients_with_overdue_vaccines",
            description: "Busca pacientes del veterinario que tengan vacunas con refuerzos vencidos (proximo_refuerzo anterior a la fecha actual).",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {},
                required: []
            }
        },
        handler: async (_args, user) => {
            if (user.rol !== "Veterinario" || !user.vetId) {
                return { error: "Solo los veterinarios pueden consultar sus pacientes." };
            }

            const clinicaIds = await VetService.getClinicasByVeterinarioId(user.vetId);
            if (!clinicaIds || clinicaIds.length === 0) {
                return { status: "success", count: 0, patients: [] };
            }

            const now = new Date();

            const activePatients = await MascotaService.getAllMascotasByVeterinarioId(user.vetId);
            if (!activePatients || activePatients.length === 0) {
                return { status: "success", count: 0, patients: [] };
            }

            const mascotaIds = activePatients.map(p => p.id);

            const overdueSeries = await db.query.vacuna_serie.findMany({
                where: and(
                    inArray(vacuna_serie.mascota_id, mascotaIds),
                    eq(vacuna_serie.estado_serie, 'completa'),
                    lt(vacuna_serie.proximo_refuerzo, now)
                ),
                with: {
                    mascota: { columns: { id: true, nombre: true } },
                    protocolo: { columns: { nombre_comercial: true } }
                }
            });

            if (!overdueSeries || overdueSeries.length === 0) {
                return { status: "success", count: 0, message: "No hay pacientes con vacunas atrasadas.", patients: [] };
            }

            const grouped = new Map<string, any>();
            for (const s of overdueSeries) {
                if (!s.mascota) continue;
                if (!grouped.has(s.mascota.id)) {
                    grouped.set(s.mascota.id, {
                        mascotaId: s.mascota.id,
                        nombre: s.mascota.nombre,
                        vacunasVencidas: []
                    });
                }
                grouped.get(s.mascota.id).vacunasVencidas.push({
                    vacuna: s.protocolo?.nombre_comercial || "No especificada",
                    proximoRefuerzo: s.proximo_refuerzo,
                    diasVencido: Math.floor((now.getTime() - new Date(s.proximo_refuerzo!).getTime()) / 86400000)
                });
            }

            return {
                status: "success",
                count: grouped.size,
                patients: Array.from(grouped.values())
            };
        }
    },
    {
        declaration: {
            name: "get_owner_contact",
            description: "Obtiene los datos de contacto de los propietarios de una mascota específica.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    mascotaId: { type: SchemaType.STRING, description: "El ID (UUID) de la mascota" }
                },
                required: ["mascotaId"]
            }
        },
        handler: async (args, user) => {
            const { mascotaId } = args as { mascotaId: string };

            const hasAccess = await Validation.hasAccessMascota(user, mascotaId);
            if (!hasAccess) return { error: "Acceso denegado." };

            const owners = await PropietarioService.getByMascotaId(mascotaId);
            if (!owners || owners.length === 0) {
                return { status: "success", message: "Esta mascota no tiene propietarios registrados.", owners: [] };
            }

            return {
                status: "success",
                owners: owners.map((rel: any) => ({
                    id: rel.propietario?.id,
                    nombre: `${rel.propietario?.nombre} ${rel.propietario?.apellido}`,
                    telefono: rel.propietario?.telefono,
                    email: rel.propietario?.usuario?.email,
                    direccion: rel.propietario?.direccion,
                    relacion: rel.tipo_relacion?.tipo || ""
                }))
            };
        }
    },
    {
        declaration: {
            name: "search_patient",
            description: "Busca mascotas por nombre o número de microchip. Devuelve hasta 10 resultados.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: { type: SchemaType.STRING, description: "Término de búsqueda (nombre o microchip)" }
                },
                required: ["query"]
            }
        },
        handler: async (args, user) => {
            const { query } = args as { query: string };

            let results: any[];
            if (user.rol === "Veterinario" && user.vetId) {
                const all = await MascotaService.getAllMascotasByVeterinarioId(user.vetId) || [];
                const q = query.toLowerCase();
                results = all.filter(p =>
                    p.nombre?.toLowerCase().includes(q) ||
                    p.numero_microchip?.toLowerCase().includes(q)
                ).slice(0, 10);
            } else if (user.rol === "Propietario" && user.proId) {
                const all = await MascotaService.getAllMascotasByPropietarioId(user.proId) || [];
                const q = query.toLowerCase();
                results = all.filter(p =>
                    p.nombre?.toLowerCase().includes(q) ||
                    p.numero_microchip?.toLowerCase().includes(q)
                ).slice(0, 10);
            } else {
                results = await MascotaService.search(query);
            }

            return {
                status: "success",
                count: results.length,
                patients: results.map((p: any) => ({
                    id: p.id,
                    nombre: p.nombre,
                    especie: p.especie,
                    raza: p.raza,
                    edad: p.edad,
                    sexo: p.sexo,
                    microchip: p.numero_microchip
                }))
            };
        }
    },
    {
        declaration: {
            name: "get_visit_summary",
            description: "Obtiene un resumen de las últimas consultas de una mascota, incluyendo fecha, peso, diagnósticos y tratamientos.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    mascotaId: { type: SchemaType.STRING, description: "El ID (UUID) de la mascota" },
                    limit: { type: SchemaType.INTEGER, description: "Cantidad de consultas a mostrar (default 5)" }
                },
                required: ["mascotaId"]
            }
        },
        handler: async (args, user) => {
            const { mascotaId, limit } = args as { mascotaId: string; limit?: number };

            const hasAccess = await Validation.hasAccessMascota(user, mascotaId);
            if (!hasAccess) return { error: "Acceso denegado." };

            const historyList = await AtencionService.getUltimasByMascotaId(mascotaId, limit || 5);

            return {
                status: "success",
                totalConsultas: historyList.length,
                visits: historyList.map((h: any) => ({
                    fecha: h.fecha_atencion,
                    veterinario: `${h.veterinario?.nombre} ${h.veterinario?.apellido}`,
                    clinica: h.clinica?.nombre_comercial,
                    peso: h.peso_actual,
                    notas: h.notas_clinicas,
                    diagnosticos: h.atenciones_diagnosticos?.map((d: any) => d.diagnostico?.diagnostico),
                    tratamientos: h.tratamientos?.map((t: any) => ({
                        tipo: t.tipo_tratamiento?.tipo,
                        medicamento: t.producto?.nombre_comercial,
                        dosis: t.dosis,
                        frecuencia: t.frecuencia
                    }))
                }))
            };
        }
    },
    {
        declaration: {
            name: "get_active_treatments",
            description: "Obtiene los tratamientos activos (sin fecha de fin o con fecha de fin futura) de una mascota.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    mascotaId: { type: SchemaType.STRING, description: "El ID (UUID) de la mascota" }
                },
                required: ["mascotaId"]
            }
        },
        handler: async (args, user) => {
            const { mascotaId } = args as { mascotaId: string };

            const hasAccess = await Validation.hasAccessMascota(user, mascotaId);
            if (!hasAccess) return { error: "Acceso denegado." };

            const treatments = await TratamientoService.getActivosByMascotaId(mascotaId);

            if (!treatments || treatments.length === 0) {
                return { status: "success", message: "Esta mascota no tiene tratamientos activos.", treatments: [] };
            }

            return {
                status: "success",
                treatments: treatments.map((t: any) => ({
                    id: t.id,
                    medicamento: t.producto?.nombre_comercial,
                    tipo: t.tipo_tratamiento?.tipo,
                    dosis: t.dosis,
                    frecuencia: t.frecuencia,
                    fechaInicio: t.fecha_inicio,
                    fechaFin: t.fecha_fin,
                    indicaciones: t.indicaciones_adicionales,
                    veterinario: `${t.atencion?.veterinario?.nombre} ${t.atencion?.veterinario?.apellido}`
                }))
            };
        }
    },
    {
        declaration: {
            name: "search_patients_on_medication",
            description: "Busca pacientes activos del veterinario que estén tomando un medicamento específico del vademécum SENASA.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: { type: SchemaType.STRING, description: "Nombre o parte del nombre del medicamento a buscar en tratamientos activos" }
                },
                required: ["query"]
            }
        },
        handler: async (args, user) => {
            if (user.rol !== "Veterinario" || !user.vetId) {
                return { error: "Solo los veterinarios pueden buscar pacientes por medicación." };
            }

            const { query } = args as { query: string };

            const clinicaIds = await VetService.getClinicasByVeterinarioId(user.vetId);
            if (!clinicaIds || clinicaIds.length === 0) {
                return { status: "success", count: 0, patients: [] };
            }

            const { matchingProducts, treatments } = await TratamientoService.searchPacientesByProducto(query, clinicaIds);

            if (matchingProducts.length === 0) {
                return { status: "success", message: "No se encontraron medicamentos con ese nombre.", patients: [] };
            }

            const grouped = new Map<string, any>();
            for (const t of treatments) {
                const mascota = t.atencion?.mascota;
                if (!mascota) continue;
                if (!grouped.has(mascota.id)) {
                    grouped.set(mascota.id, {
                        mascotaId: mascota.id,
                        nombre: mascota.nombre,
                        medicamentos: []
                    });
                }
                grouped.get(mascota.id).medicamentos.push({
                    producto: t.producto?.nombre_comercial,
                    dosis: t.dosis,
                    frecuencia: t.frecuencia
                });
            }

            return {
                status: "success",
                count: grouped.size,
                patients: Array.from(grouped.values())
            };
        }
    }
];

export function getToolDeclarations(): FunctionDeclaration[] {
    return tools.map(t => t.declaration);
}

export function findTool(name: string): Tool | undefined {
    return tools.find(t => t.declaration.name === name);
}
