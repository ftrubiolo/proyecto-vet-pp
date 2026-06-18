import { FastifyRequest, FastifyReply } from "fastify";
import { AtencionService, AtencionInput } from "../services/atencion.service";
import { Validation } from "../utils/validation";
import { PdfService } from "../services/pdf.service";

export const getByMascota = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { mascotaId } = request.params as { mascotaId: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const hasAccess = await Validation.hasAccessMascota(request.user, mascotaId);
        if (!hasAccess) {
            return reply.code(403).send({ message: 'No tienes permiso para ver el historial de esta mascota' });
        }

        const result = await AtencionService.getByMascotaId(mascotaId);
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = request.body as AtencionInput;
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    // Force veterinarian ID from session if role is Veterinario
    if (request.user.rol === 'Veterinario') {
        if (!request.user.vetId) {
            return reply.code(400).send({ message: 'El usuario no tiene un perfil de veterinario asociado' });
        }
        data.veterinario_id = request.user.vetId;
    }

    try {
        const hasAccess = await Validation.hasAccessMascota(request.user, data.mascota_id);
        if (!hasAccess) {
            return reply.code(403).send({ message: 'No tienes acceso a este paciente' });
        }

        const result = await AtencionService.create(data);
        return reply.code(201).send({ message: 'Consulta registrada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const downloadPdf = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const atencion = await AtencionService.getById(id);
        if (!atencion) {
            return reply.code(404).send({ message: 'Consulta no encontrada' });
        }

        const hasAccess = await Validation.hasAccessMascota(request.user, atencion.mascota_id);
        if (!hasAccess) {
            return reply.code(403).send({ message: 'No tienes acceso al historial de este paciente' });
        }

        const buffer = await PdfService.generateAtencionPdf(atencion);
        
        reply.header('Content-Type', 'application/pdf');
        reply.header('Content-Disposition', `attachment; filename="consulta-${atencion.mascota?.nombre || 'mascota'}-${id.substring(0, 8)}.pdf"`);
        return reply.code(200).send(buffer);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error al generar el PDF';
        return reply.code(500).send({ message });
    }
};

