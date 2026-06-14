import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

import type { TokenPayload } from '@vetvault/shared';
// Extendemos el Request de Fastify para que acepte nuestra propiedad 'user'
declare module 'fastify' {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

/**
 * Middleware (preHandler hook) para verificar si el usuario tiene un token válido
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const verifyToken = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    let token = request.cookies.token;
    if (!token) return reply.code(403).send({ error: "Acceso denegado. No se proporcionó un token." });

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        request.user = decoded;
    } catch (error: any) {
        reply.code(403).send({
            error: "Token inválido o expirado.",
            detalle: error.message || error
        });
    }
};

/** 
 * Middleware (preHandler hook) para autorizar según el rol del usuario
 * @param rolesPermitidos - Roles permitidos ej: ['Veterinario', 'Admin']
 **/
export const checkRole = (rolesPermitidos: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        if (!request.user) return reply.code(403).send({ error: "No tienes los permisos necesarios para realizar esta acción." });

        if (!rolesPermitidos.includes(request.user.rol)) {
            reply.code(403).send({ error: "No tienes los permisos necesarios para realizar esta acción." });
        }
    };
};