import { FastifyRequest, FastifyReply } from "fastify";
import { MascotaService } from "../services/mascota.service";
import { NewMascota, UpdateMascota } from "../types/db.types";
import type { CreateMascotaInput } from "@vetvault/shared";
import { db } from "../db";
import { Validation } from "../utils/validation";

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        let result;
        if (request.user.rol === 'Admin') {
            result = await MascotaService.getAll();
        } else if (request.user.rol === 'Veterinario') {
            if (!request.user.vetId) {
                return reply.code(400).send({ message: 'El usuario no tiene un perfil de veterinario asociado' });
            }
            result = await MascotaService.getAllMascotasByVeterinarioId(request.user.vetId);
        } else if (request.user.rol === 'Propietario') {
            if (!request.user.proId) {
                return reply.code(400).send({ message: 'El usuario no tiene un perfil de propietario asociado' });
            }
            result = await MascotaService.getAllMascotasByPropietarioId(request.user.proId);
        } else {
            return reply.code(403).send({ message: 'No tienes permisos para ver esta lista de pacientes' });
        }
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };

    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    const hasAccess = await Validation.hasAccessMascota(request.user, id)
    if (!hasAccess) return reply.code(403).send({ message: 'No tienes permiso para ver esta mascota' });

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
            const newMascota = await MascotaService.create({
                ...mascota,
                fecha_nacimiento: new Date(mascota.fecha_nacimiento)
            } as NewMascota, tx);
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

    const hasAccess = await Validation.hasAccessMascota(request.user, id)
    if (!hasAccess) return reply.code(403).send({ message: 'No tienes permiso para actualizar esta mascota' });

    try {
        const result = await MascotaService.update(id, data);
        if (!result) return reply.code(404).send({ message: 'Mascota no encontrada' });
        return reply.code(200).send({ message: 'Mascota actualizada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

import { eq } from "drizzle-orm";
import { mascotas, mascotas_propietarios } from "../db/schema";

export const buscarExistente = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };

    try {
        const m = await db.query.mascotas.findFirst({
            where: eq(mascotas.id, id),
            with: {
                raza: {
                    with: {
                        especie: true
                    }
                },
                mascotas_propietarios: {
                    where: eq(mascotas_propietarios.activo, true),
                    with: {
                        propietario: {
                            columns: {
                                nombre: true,
                                apellido: true
                            }
                        }
                    }
                }
            }
        });

        if (!m) {
            return reply.code(404).send({ message: 'Mascota no encontrada' });
        }

        const propietario = m.mascotas_propietarios?.[0]?.propietario;
        return reply.code(200).send({
            id: m.id,
            nombre: m.nombre,
            sexo: m.sexo,
            especie: m.raza?.especie?.especie || 'Desconocido',
            raza: m.raza?.raza || 'Desconocido',
            propietario: propietario ? `${propietario.nombre} ${propietario.apellido}` : 'Sin propietario'
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}