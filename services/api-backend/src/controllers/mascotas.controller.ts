import { FastifyRequest, FastifyReply } from "fastify";
import { MascotaService } from "../services/mascota.service";
import { UpdateMascota } from "../types/db.types";
import { CreateMascotaInput } from "../types/mascota.types";
import { db } from "../db";
import { Validation } from "../utils/validation";

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

    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    const hasAcces = await Validation.hasAccesMascota(request.user, id)
    if (!hasAcces) return reply.code(403).send({ message: 'No tienes permiso para ver esta mascota' });

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
    const { mascota, propietario } = request.body as CreateMascotaInput;

    try {
        const result = await db.transaction(async (tx) => {
            const newMascota = await MascotaService.create(mascota, tx);
            const newRelacion = await MascotaService.associateWithOwner(newMascota.id, propietario.propietario_id, propietario.tipo_relacion_id, tx);
            return { newMascota, newRelacion };
        });
        return reply.code(201).send({ message: 'Mascota creada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateMascota;

    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    const hasAcces = await Validation.hasAccesMascota(request.user, id)
    if (!hasAcces) return reply.code(403).send({ message: 'No tienes permiso para actualizar esta mascota' });

    try {
        const result = await MascotaService.update(id, data);
        if (!result) return reply.code(404).send({ message: 'Mascota no encontrada' });
        return reply.code(200).send({ message: 'Mascota actualizada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}