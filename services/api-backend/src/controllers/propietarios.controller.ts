import { FastifyRequest, FastifyReply } from 'fastify';
import { PropietarioService } from '../services/propietario.service';
import { Validation } from '../utils/validation';
import { UpdatePropietario } from '../types/db.types';
import { MascotaService } from '../services/mascota.service';

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const props = await PropietarioService.getAll();
        return reply.code(200).send(props);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };

    const isValid = Validation.hasAccess(request.user, id);
    if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

    try {
        const prop = await PropietarioService.getById(id);
        if (!prop) return reply.code(404).send({ message: 'Propietario no encontrado' });
        return reply.code(200).send(prop);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const getAllMascotas = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.user as { id: string };

    // const isValid = Validation.hasAccess(request.user, id);
    // if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

    try {
        const mascotas = await MascotaService.getAllMascotasByPropietarioId(id);
        return reply.code(200).send(mascotas);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdatePropietario;

    const isValid = Validation.hasAccess(request.user, id);
    if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

    try {
        const prop = await PropietarioService.update(id, data);
        if (!prop) return reply.code(404).send({ message: 'Propietario no encontrado' });
        return reply.code(200).send({
            message: 'Propietario actualizado exitosamente',
            prop
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}
