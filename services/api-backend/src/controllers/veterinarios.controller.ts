import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { veterinarios } from '../db/schema';

export const obtenerPerfil = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
};