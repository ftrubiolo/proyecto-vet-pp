import { FastifyRequest, FastifyReply } from "fastify";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { catalogo_productos, vacunas, tratamientos, citas } from "../db/schema";
import { Validation } from "../utils/validation";
import { MascotaService } from "../services/mascota.service";
import { AtencionService } from "../services/atencion.service";
import { CitaService } from "../services/cita.service";

interface ChatMessage {
    sender: "user" | "ai";
    text: string;
}

interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    context?: {
        activeMascotaId?: string;
    };
}

export const chat = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user;
    if (!user) {
        return reply.code(401).send({ message: "No autorizado" });
    }

    const { message, history = [], context } = request.body as ChatRequest;

    if (!message || !message.trim()) {
        return reply.code(400).send({ message: "El mensaje es obligatorio" });
    }

    // 1. Validate permissions if a specific pet is selected in context
    let activePetId = context?.activeMascotaId;
    if (activePetId) {
        const hasAccess = await Validation.hasAccessMascota(user, activePetId);
        if (!hasAccess) {
            return reply.code(403).send({ message: "No tienes permiso para acceder a esta mascota" });
        }
    }

    try {
        // 2. Fetch context databases for RAG
        let clinicalContext = "";
        let generalContext = "";

        if (activePetId) {
            // Detailed context for the active pet
            const pet = await MascotaService.getById(activePetId);
            const historyList = await AtencionService.getByMascotaId(activePetId);

            clinicalContext = `
INFORMACIÓN DEL PACIENTE ACTIVO:
Nombre: ${pet?.nombre}
Especie: ${pet?.especie}
Raza: ${pet?.raza}
Edad: ${pet?.edad} años (Fecha nac: ${pet?.fecha_nacimiento})
Sexo: ${pet?.sexo === "M" ? "Macho" : "Hembra"}
Castrado: ${pet?.es_castrado ? "Sí" : "No"}
Microchip: ${pet?.numero_microchip || "N/A"}
Alergias: ${pet?.alergias || "Ninguna registrada"}
Condiciones Crónicas: ${pet?.condiciones_cronicas || "Ninguna registrada"}
Contraindicaciones: ${pet?.contraindicaciones || "Ninguna registrada"}

HISTORIAL DE CONSULTAS Y ATENCIONES:
${JSON.stringify(historyList?.map(h => ({
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
        frecuencia: t.frecuencia,
        indicaciones: t.indicaciones_adicionales
    }))
})))}
            `;
        } else {
            // General context (list only authorized pets for the user)
            let petsList: any[] = [];
            if (user.rol === "Admin") {
                petsList = (await MascotaService.getAll()) || [];
            } else if (user.rol === "Veterinario") {
                if (user.vetId) {
                    petsList = (await MascotaService.getAllMascotasByVeterinarioId(user.vetId)) || [];
                }
            } else if (user.rol === "Propietario") {
                if (user.proId) {
                    petsList = (await MascotaService.getAllMascotasByPropietarioId(user.proId)) || [];
                }
            }

            generalContext = `
MASCOTAS A LAS QUE TIENES ACCESO:
${JSON.stringify(petsList.map(p => ({
    id: p.id,
    nombre: p.nombre,
    especie: p.especie,
    raza: p.raza,
    edad: p.edad
})))}
            `;
        }

        // 3. Define System Prompt based on role
        let systemInstruction = "";
        if (user.rol === "Veterinario") {
            systemInstruction = `
Eres VetVault Copilot, un asistente de IA clínico especializado en veterinaria. Tu rol es asistir al veterinario en el box clínico o durante su jornada laboral.
Solo tienes acceso a los pacientes asignados en tu lista o al paciente activo. Nunca inventes información de pacientes a los que no tienes acceso.

Contexto actual disponible:
${activePetId ? clinicalContext : generalContext}

Instrucciones:
1. Responde de manera profesional, técnica y clara en español.
2. Si el veterinario te pide información sobre un paciente al que tienes acceso, proporciónala basándote en su historial.
3. Si te solicita agendar una cita o realizar una consulta del vademécum (catálogo de fármacos de SENASA), utiliza las herramientas (tools) disponibles para ello.
4. Siempre menciona que las dosis recomendadas del vademécum son orientativas y deben validarse clínicamente según el caso.
            `;
        } else if (user.rol === "Propietario") {
            systemInstruction = `
Eres VetVault Copilot, un asistente inteligente de orientación para dueños y tutores de mascotas.
Solo tienes acceso a las mascotas de este tutor. Nunca menciónes ni inventes otras mascotas.

Contexto actual disponible:
${activePetId ? clinicalContext : generalContext}

Instrucciones de seguridad críticas:
1. Responde con un tono empático, cálido, comprensivo y simple en español. No uses lenguaje médico excesivamente complejo; traduce los diagnósticos de los veterinarios a explicaciones sencillas si te lo piden.
2. NUNCA mediques ni prelogoscribas dosis específicas de fármacos de forma autónoma. Si el dueño te consulta sobre medicamentos, adviértele sobre el riesgo de la automedicación.
3. Realiza un triaje básico de síntomas:
   - Rojo (Emergencia - ej. sangrado profuso, dificultad respiratoria severa, convulsiones, ingesta de tóxicos): Aconseja ir de inmediato a la veterinaria de guardia.
   - Amarillo (Urgente - ej. vómitos persistentes, renguera aguda, diarrea con sangre, fiebre): Aconseja reservar un turno prioritario para hoy.
   - Verde (Control - ej. vacunas, desparasitación, caída de pelo leve): Indica cuidados básicos y ofrece reservar un turno regular.
4. Si el tutor decide agendar un turno para una de sus mascotas, indícale que puedes ayudarle a reservarlo mediante tus herramientas de agendamiento.
            `;
        } else {
            // Admin
            systemInstruction = `
Eres VetVault Copilot, el asistente administrativo de la clínica para administradores del sistema.
Solo tienes acceso a las mascotas del sistema de tu clínica.
Contexto:
${activePetId ? clinicalContext : generalContext}
            `;
        }

        // 4. Initialize Gemini
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (!geminiApiKey) {
            return reply.code(500).send({ message: "La API Key de Gemini no está configurada en el servidor" });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);

        // Define tools / function declarations
        const tools: any[] = [];

        // Citas tool is available for both, but authorization will be double checked
        tools.push({
            functionDeclarations: [
                {
                    name: "schedule_appointment",
                    description: "Registra una cita o turno médico en el sistema para una mascota en una clínica específica.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            mascotaId: { type: "STRING", description: "El ID (UUID) de la mascota" },
                            clinicaId: { type: "STRING", description: "El ID (UUID) de la clínica donde se atenderá" },
                            fechaHora: { type: "STRING", description: "La fecha y hora propuesta en formato ISO 8601 (ej. 2026-06-20T10:00:00Z)" },
                            motivoId: { type: "INTEGER", description: "El ID del motivo de la cita: 1 = Consulta General, 2 = Vacunación, 3 = Urgencia, 4 = Control" }
                        },
                        required: ["mascotaId", "clinicaId", "fechaHora", "motivoId"]
                    }
                },
                {
                    name: "search_vademecum",
                    description: "Busca un producto, medicamento o vacuna en el vademécum de SENASA por coincidencia de nombre o firma.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            query: { type: "STRING", description: "Término de búsqueda del medicamento" }
                        },
                        required: ["query"]
                    }
                },
                {
                    name: "get_medical_history",
                    description: "Permite consultar el historial médico y las notas clínicas detalladas de una mascota específica si no están cargadas.",
                    parameters: {
                        type: "OBJECT",
                        properties: {
                            mascotaId: { type: "STRING", description: "El ID (UUID) de la mascota" }
                        },
                        required: ["mascotaId"]
                    }
                }
            ]
        });

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction,
            tools
        });

        // Map frontend chat history to Gemini structure
        const geminiHistory = history.map((msg) => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }]
        }));

        const chatSession = model.startChat({
            history: geminiHistory
        });

        let result = await chatSession.sendMessage(message);

        // 5. Handle Function Calling Loop
        let limit = 5; // safety limit to prevent infinite loops
        let calls = result.response.functionCalls();
        while (calls && calls.length > 0 && limit > 0) {
            limit--;
            const call = calls[0];
            let functionResult: any;

            try {
                if (call.name === "schedule_appointment") {
                    const args = call.args as { mascotaId: string; clinicaId: string; fechaHora: string; motivoId: number };

                    // SECURITY CHECK: Verify if the user has access to this pet before scheduling
                    const hasAccess = await Validation.hasAccessMascota(user, args.mascotaId);
                    if (!hasAccess) {
                        functionResult = { error: "Acceso denegado: No posees permisos de acceso a la mascota especificada." };
                    } else {
                        const appointmentData: any = {
                            mascota_id: args.mascotaId,
                            clinica_id: args.clinicaId,
                            fecha_hora: new Date(args.fechaHora),
                            motivo_id: args.motivoId,
                            estado_cita_id: 1 // Agendada
                        };

                        if (user.rol === "Veterinario" && user.vetId) {
                            appointmentData.veterinario_id = user.vetId;
                        }

                        const newCita = await CitaService.create(appointmentData);
                        functionResult = {
                            status: "success",
                            message: "Cita médica programada con éxito",
                            citaId: newCita.id,
                            fechaHora: newCita.fecha_hora
                        };
                    }
                } else if (call.name === "search_vademecum") {
                    const args = call.args as { query: string };
                    const allProducts = await db.query.catalogo_productos.findMany();
                    const q = args.query.toLowerCase();
                    const filtered = allProducts.filter(p =>
                        p.nombre_comercial.toLowerCase().includes(q) ||
                        p.nombre_firma.toLowerCase().includes(q) ||
                        p.numero_senasa.toLowerCase().includes(q)
                    ).slice(0, 8);

                    functionResult = { status: "success", count: filtered.length, products: filtered };
                } else if (call.name === "get_medical_history") {
                    const args = call.args as { mascotaId: string };

                    // SECURITY CHECK: Verify access
                    const hasAccess = await Validation.hasAccessMascota(user, args.mascotaId);
                    if (!hasAccess) {
                        functionResult = { error: "Acceso denegado: No tienes permisos para ver el historial clínico de esta mascota." };
                    } else {
                        const historyList = await AtencionService.getByMascotaId(args.mascotaId);
                        functionResult = {
                            status: "success",
                            history: historyList.map(h => ({
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
                } else {
                    functionResult = { error: "Función no reconocida o no implementada." };
                }
            } catch (err) {
                functionResult = { error: err instanceof Error ? err.message : "Error inesperado ejecutando la función." };
            }

            // Feed the function execution result back into the chat session
            result = await chatSession.sendMessage([{
                functionResponse: {
                    name: call.name,
                    response: functionResult
                }
            }]);
            calls = result.response.functionCalls();
        }

        const replyText = result.response.text();
        return reply.code(200).send({ response: replyText });

    } catch (error) {
        const message = error instanceof Error ? error.message : "Error de comunicación con el agente de IA";
        return reply.code(500).send({ message });
    }
};
