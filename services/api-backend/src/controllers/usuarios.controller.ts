import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';
import { Validation } from '../utils/validation';
import { UpdateUsuarioInput } from '../types/auth.types';

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const users = await UserService.getAll();

        return reply.code(200).send(users);
    } catch (error) {
        reply.code(500).send({ message: 'Error al obtener los usuarios' });
    }
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: userId } = request.params as { id: string };

    try {
        const user = await UserService.getById(userId);
        if (!user) return reply.code(404).send({ message: 'Usuario no encontrado' });

        return reply.code(200).send(user);
    } catch (error) {
        reply.code(500).send({ message: 'Error al obtener el usuario' });
    }
}

export const getMe = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) return reply.code(401).send({ error: 'No se proporcionó un token.' });
    try {
        const user = await UserService.getById(request.user.id);
        if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

        return reply.code(200).send(user);
    } catch (error) {
        reply.code(500).send({ message: 'Error al obtener el usuario' });
    }
}

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const body = request.body as UpdateUsuarioInput;

    if (!request.user) return reply.code(401).send({ message: 'No se proporcionó un token' });
    if (!Validation.hasAccess(request.user, id)) return reply.code(401).send({ message: 'No tienes permiso para actualizar este usuario' });

    if (!body.email && !body.password) return reply.status(400).send({ message: 'Debe proporcionar al menos un campo para actualizar' });

    try {
        if (body.email && await Validation.existingUser(body.email)) return reply.status(400).send({ message: "El correo ya existe" });

        const updatedUser = await UserService.update(id, body);
        if (!updatedUser) return reply.code(404).send({ message: 'Usuario no encontrado' });

        return reply.code(200).send(updatedUser);
    } catch (error) {
        reply.code(500).send({ message: 'Error al actualizar el usuario' });
    }
}

export const remove = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
}