import { FastifyRequest, FastifyReply } from "fastify";
import { MascotaService } from "../services/mascota.service";
import { NewMascota, UpdateMascota } from "../types/db.types";

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const result = await MascotaService.getAll();
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };

    try {
        const result = await MascotaService.getById(id);
        if (!result) return reply.code(404).send({ message: 'Mascota no encontrada' });
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = request.body as NewMascota;

    try {
        const result = await MascotaService.create(data);
        return reply.code(200).send({ message: 'Mascota creada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateMascota;

    try {
        const result = await MascotaService.update(id, data);
        if (!result) return reply.code(404).send({ message: 'Mascota no encontrada' });
        return reply.code(200).send({ message: 'Mascota actualizada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}