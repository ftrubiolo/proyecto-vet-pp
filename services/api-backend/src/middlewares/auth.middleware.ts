import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// 1. Definimos la forma de los datos que guardamos en el Token
export interface TokenPayload {
    id: number;
    vetId?: number;
    proId?: number;
    email: string;
    rol: string; // 'Veterinario', 'Propietario', 'Admin'
}

// 2. Extendemos el Request de Fastify para que acepte nuestra propiedad 'user'
declare module 'fastify' {
    interface FastifyRequest {
        user?: TokenPayload;
    }
}

const JWT_SECRET = process.env.JWT_SECRET as string;

//
// Middleware (preHandler hook) para verificar si el usuario tiene un token válido
//
export const verifyToken = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // 1. Intentar obtener el token de las cookies, y caer en el header Authorization como respaldo
    let token = request.cookies.token;

    if (!token) {
        const authHeader = request.headers['authorization'];
        token = authHeader && authHeader.split(' ')[1];
    }

    if (!token) {
        reply.code(401).send({ error: "Acceso denegado. No se proporcionó un token." });
        return;
    }

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

//
// Middleware (preHandler hook) para autorizar según el rol del usuario
//
export const checkRole = (rolesPermitidos: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        // Validamos que exista request.user y que su rol esté en el array permitido
        if (!request.user || !rolesPermitidos.includes(request.user.rol)) {
            reply.code(403).send({ error: "No tienes los permisos necesarios para realizar esta acción." });
        }
    };
};