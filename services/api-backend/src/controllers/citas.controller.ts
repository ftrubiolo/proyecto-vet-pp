import { FastifyRequest, FastifyReply } from "fastify";
import { CitaService } from "../services/cita.service";
import { Validation } from "../utils/validation";
import type { NewCita, UpdateCita } from "../types/db.types";

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        let result;
        if (request.user.rol === 'Admin') {
            result = await CitaService.getAll();
        } else if (request.user.rol === 'Veterinario') {
            if (!request.user.vetId) {
                return reply.code(400).send({ message: 'El usuario no tiene un perfil de veterinario asociado' });
            }
            result = await CitaService.getByVeterinarioId(request.user.vetId);
        } else if (request.user.rol === 'Propietario') {
            if (!request.user.proId) {
                return reply.code(400).send({ message: 'El usuario no tiene un perfil de propietario asociado' });
            }
            result = await CitaService.getByPropietarioId(request.user.proId);
        } else {
            return reply.code(403).send({ message: 'No tienes permisos para ver esta lista de citas' });
        }
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const cita = await CitaService.getById(id);
        if (!cita) return reply.code(404).send({ message: 'Cita no encontrada' });

        const hasAccess = await Validation.hasAccessMascota(request.user, cita.mascota_id);
        if (!hasAccess && request.user.rol !== 'Admin' && request.user.vetId !== cita.veterinario_id) {
            return reply.code(403).send({ message: 'No tienes permiso para ver esta cita' });
        }

        return reply.code(200).send(cita);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const create = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const data = request.body as NewCita;
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    // Validate if user has access to create a cita for this pet
    const hasAccess = await Validation.hasAccessMascota(request.user, data.mascota_id);
    if (!hasAccess) {
        return reply.code(403).send({ message: 'No tienes permiso para agendar citas para esta mascota' });
    }

    try {
        const newCita = await CitaService.create(data);
        return reply.code(201).send({ message: 'Cita agendada exitosamente', result: newCita });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateCita;
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const cita = await CitaService.getById(id);
        if (!cita) return reply.code(404).send({ message: 'Cita no encontrada' });

        const hasAccess = await Validation.hasAccessMascota(request.user, cita.mascota_id);
        if (!hasAccess && request.user.rol !== 'Admin' && request.user.vetId !== cita.veterinario_id) {
            return reply.code(403).send({ message: 'No tienes permiso para modificar esta cita' });
        }

        const result = await CitaService.update(id, data);
        return reply.code(200).send({ message: 'Cita actualizada exitosamente', result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};
