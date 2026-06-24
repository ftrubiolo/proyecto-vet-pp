import { FastifyRequest, FastifyReply } from "fastify";
import { Validation } from "../utils/validation";
import { checkRateLimit } from "../utils/rate-limiter";
import { PdfService } from "../services/pdf.service";
import { AiChatService } from "../services/ai/chat.service";
import type { ChatRequest } from "../services/ai/types";

const MAX_HISTORY_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 2000;

export const chat = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user;
    if (!user) {
        return reply.code(401).send({ message: "No autorizado" });
    }

    // Rate limiting por usuario
    const { allowed, remaining, resetInMs } = checkRateLimit(`ai:${user.id}`);
    if (!allowed) {
        return reply.code(429).header("Retry-After", String(Math.ceil(resetInMs / 1000))).send({
            message: "Demasiadas solicitudes. Intentá de nuevo en unos segundos.",
        });
    }

    const { message, history = [], context } = request.body as ChatRequest;

    if (!message || !message.trim()) {
        return reply.code(400).send({ message: "El mensaje es obligatorio" });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return reply.code(400).send({ message: `El mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres.` });
    }

    // Sanitizar history: solo aceptar sender "user", limitar longitud
    const safeHistory = history
        .filter(msg => msg.sender === "user" && msg.text.length <= MAX_MESSAGE_LENGTH)
        .slice(-MAX_HISTORY_LENGTH);

    if (context?.activeMascotaId) {
        const hasAccess = await Validation.hasAccessMascota(user, context.activeMascotaId);
        if (!hasAccess) {
            return reply.code(403).send({ message: "No tienes permiso para acceder a esta mascota" });
        }
    }

    try {
        const response = await AiChatService.processMessage(user, message, safeHistory, context);
        return reply.code(200).send({ response });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Error de comunicación con el agente de IA";
        return reply.code(500).send({ message });
    }
};

export const downloadChatPdf = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { title, content } = request.body as { title: string; content: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });
    if (!title || !content) {
        return reply.code(400).send({ message: 'El título y el contenido son obligatorios' });
    }

    try {
        const buffer = await PdfService.generateAIChatPdf(title, content);
        
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="consulta-ia-${Date.now()}.pdf"`);
        return reply.code(200).send(buffer);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al generar el PDF';
        return reply.code(500).send({ message });
    }
};

