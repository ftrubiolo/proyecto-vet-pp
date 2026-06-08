import { FastifyReply, FastifyRequest } from 'fastify';
import { UserService } from '../services/user.service';

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const users = await UserService.getAll();

    return reply.status(200).send(users);
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: userId } = request.params as { id: string };

    const user = await UserService.getById(userId);
    if (!user) return reply.status(404).send({ message: 'Usuario no encontrado' });

    return reply.status(200).send(user);
}

export const getMe = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) return reply.code(401).send({ error: 'No se proporcionó un token.' });
    const user = await UserService.getById(request.user.id);
    if (!user) return reply.code(404).send({ error: 'Usuario no encontrado' });

    return reply.code(200).send(user);
}

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id: userId } = request.params as { id: string };
    const user = await UserService.getById(userId);
    if (!user) return reply.status(404).send({ message: 'Usuario no encontrado' });

    const { email, password } = request.body as { email: string; password?: string };
    if (!email && !password) return reply.status(400).send({ message: 'Debe proporcionar al menos un campo para actualizar' });

    const updatedUser = await UserService.update(userId, { email, password });

    return reply.status(200).send(updatedUser);
}

export const remove = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
}