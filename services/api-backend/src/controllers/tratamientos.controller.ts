import { FastifyRequest, FastifyReply } from "fastify";
import { TratamientoService } from "../services/tratamiento.service";
import { Validation } from "../utils/validation";
import type { UpdateTratamiento } from "../types/db.types";

export const getByMascota = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { mascotaId } = request.params as { mascotaId: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const hasAccess = await Validation.hasAccesMascota(request.user, mascotaId);
        if (!hasAccess) {
            return reply.code(403).send({ message: 'No tienes permiso para ver los tratamientos de esta mascota' });
        }

        const result = await TratamientoService.getByMascotaId(mascotaId);
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateTratamiento;
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        // Only veterinarian or admin can update treatments (e.g. modify end date)
        if (request.user.rol !== 'Veterinario' && request.user.rol !== 'Admin') {
            return reply.code(403).send({ message: 'No tienes permiso para modificar tratamientos' });
        }

        const result = await TratamientoService.update(id, data);
        if (!result) return reply.code(404).send({ message: 'Tratamiento no encontrado' });

        return reply.code(200).send({ message: 'Tratamiento actualizado exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};
