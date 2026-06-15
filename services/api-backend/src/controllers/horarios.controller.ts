import { FastifyRequest, FastifyReply } from "fastify";
import { HorarioService } from "../services/horario.service";
import { Validation } from "../utils/validation";
import type { NewHorarioLaboral } from "../types/db.types";

export const getHorarios = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id } = request.params as { id: string };

    const isSelf = Validation.isSelfVeterinario(request.user, id);
    if (!isSelf && request.user?.rol !== 'Admin') {
        return reply.code(403).send({ message: "No tienes permiso para ver estos horarios" });
    }

    try {
        const result = await HorarioService.getByVeterinarioId(id);
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const updateHorarios = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { id, clinicaId } = request.params as { id: string; clinicaId: string };
    const body = request.body as { horarios: Omit<NewHorarioLaboral, 'id' | 'veterinario_id' | 'clinica_id'>[] };

    const isSelf = Validation.isSelfVeterinario(request.user, id);
    if (!isSelf && request.user?.rol !== 'Admin') {
        return reply.code(403).send({ message: "No tienes permiso para modificar estos horarios" });
    }

    if (!Array.isArray(body.horarios)) {
        return reply.code(400).send({ message: "El cuerpo debe contener un array 'horarios'" });
    }

    try {
        const result = await HorarioService.updateClinicaHorarios(id, clinicaId, body.horarios);
        return reply.code(200).send({ message: "Horarios actualizados exitosamente", result });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};

export const getDisponibilidad = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { clinicaId, veterinarioId, fecha } = request.query as { clinicaId: string; veterinarioId: string; fecha: string };

    if (!clinicaId || !veterinarioId || !fecha) {
        return reply.code(400).send({ message: "Faltan parámetros obligatorios: clinicaId, veterinarioId y fecha (YYYY-MM-DD)" });
    }

    try {
        const result = await HorarioService.calcularDisponibilidad(clinicaId, veterinarioId, fecha);
        return reply.code(200).send(result);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};
