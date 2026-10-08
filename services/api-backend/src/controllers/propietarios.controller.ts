import { FastifyRequest, FastifyReply } from 'fastify';
import { PropietarioService } from '../services/propietario.service';
import { Validation } from '../utils/validation';
import { UpdatePropietario } from '../types/db.types';
import { MascotaService } from '../services/mascota.service';
import { handleControllerError } from '../utils/error-handler';

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const props = await PropietarioService.getAll();
        return reply.code(200).send(props);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener los propietarios');
    }
};

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };

    const isValid = Validation.isSelfPropietario(request.user, id);
    if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

    try {
        const prop = await PropietarioService.getById(id);
        if (!prop) return reply.code(404).send({ message: 'Propietario no encontrado' });
        return reply.code(200).send(prop);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener el propietario');
    }
};

export const getAllMascotas = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user || !request.user.proId) {
        return reply.code(401).send({ message: 'No autorizado o perfil de propietario no encontrado' });
    }

    try {
        const mascotas = await MascotaService.getAllMascotasByPropietarioId(request.user.proId);
        return reply.code(200).send(mascotas);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener las mascotas del propietario');
    }
};

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdatePropietario;

    const isValid = Validation.isSelfPropietario(request.user, id);
    if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

    try {
        const prop = await PropietarioService.update(id, data);
        if (!prop) return reply.code(404).send({ message: 'Propietario no encontrado' });
        return reply.code(200).send({
            message: 'Propietario actualizado exitosamente',
            prop
        });
    } catch (error) {
        return handleControllerError(error, reply, 'Error al actualizar el propietario');
    }
};

export const buscar = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { q } = request.query as { q?: string };
    if (!q) {
        return reply.code(200).send([]);
    }

    try {
        const results = await PropietarioService.search(q);
        return reply.code(200).send(results);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al buscar propietarios');
    }
};
