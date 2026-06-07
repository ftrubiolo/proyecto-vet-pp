import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, roles, propietarios } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Validation } from '../utils/validation';

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const rawPropietarios = await db.query.propietarios.findMany({
            columns: {
                id: true,
                nombre: true,
                apellido: true,
                es_empresa: true,
                razon_social: true,
                foto_url: true,
                telefono: true,
                direccion: true,
            },
            with: {
                usuario: {
                    columns: {
                        id: true,
                        email: true,
                    },
                    with: {
                        rol: {
                            columns: {
                                rol: true,
                            },
                        },
                    },
                },
                mascotas_propietarios: {
                    columns: {
                        activo: true,
                    },
                },
            },
        });

        const result = rawPropietarios.map(p => {
            const { mascotas_propietarios, ...rest } = p;
            return {
                ...rest,
                cantidad_mascotas: mascotas_propietarios.filter(mp => mp.activo).length
            };
        });

        reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const { id } = request.params as { id: string };
        const result = await db.query.propietarios.findFirst({
            where: eq(propietarios.id, id),
            columns: {
                id: true,
                usuario_id: true,
                nombre: true,
                apellido: true,
                es_empresa: true,
                razon_social: true,
                foto_url: true,
                telefono: true,
                direccion: true,
            },
            with: {
                usuario: {
                    columns: {
                        id: true,
                        email: true,
                    },
                    with: {
                        rol: {
                            columns: {
                                rol: true,
                            },
                        },
                    },
                },
            },
        });
        reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
}

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const { id } = request.params as { id: string };
        const propietarioRecord = await db.query.propietarios.findFirst({
            where: eq(propietarios.id, id)
        });

        if (!propietarioRecord) {
            return reply.code(404).send({ message: "Propietario no encontrado" });
        }

        if (!Validation.hasAccess(request.user, propietarioRecord.usuario_id)) {
            return reply.code(403).send({ message: "No tienes permiso para realizar esta acción." });
        }

        const { nombre, apellido, es_empresa, razon_social, foto_url, telefono, direccion } = request.body as {
            nombre: string;
            apellido: string;
            es_empresa: boolean;
            razon_social: string;
            foto_url: string;
            telefono: string;
            direccion: string;
        };
        const result = await db.update(propietarios).set({
            nombre,
            apellido,
            es_empresa,
            razon_social,
            foto_url,
            telefono,
            direccion,
        }).where(eq(propietarios.id, id)).returning();
        reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
}

export const remove = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const { id } = request.params as { id: string };
        const result = await db.delete(propietarios).where(eq(propietarios.id, id)).returning();
        reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
}