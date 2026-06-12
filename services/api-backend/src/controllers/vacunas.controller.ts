import { FastifyRequest, FastifyReply } from "fastify";
import { VacunaService } from "../services/vacuna.service";
import { Validation } from "../utils/validation";

export const getByMascota = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { mascotaId } = request.params as { mascotaId: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const hasAccess = await Validation.hasAccesMascota(request.user, mascotaId);
        if (!hasAccess) {
            return reply.code(403).send({ message: 'No tienes permiso para ver las vacunas de esta mascota' });
        }

        const result = await VacunaService.getByMascotaId(mascotaId);
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};
