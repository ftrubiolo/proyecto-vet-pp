import { FastifyRequest, FastifyReply } from 'fastify';
import { VetService } from '../services/veterinario.service';
import jwt from 'jsonwebtoken';
import { Validation } from '../utils/validation';
import { UpdateVeterinario } from '../types/db.types';
import { ClinicaService } from '../services/clinica.service';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const getAll = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const veters = await VetService.getAll();
    return reply.code(200).send(veters);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return reply.code(500).send({ message });
  }
}

export const getOne = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };

  const isValid = Validation.isSelfVeterinario(request.user, id);
  if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

  try {
    const vet = await VetService.getById(id);
    if (!vet) return reply.code(404).send({ message: "Veterinario no encontrado" });

    return reply.code(200).send(vet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return reply.code(500).send({ message });
  }
};

export const generarInvitacion = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { clinicaId } = request.body as { clinicaId: string };
  const user = request.user;
  if (!user) return reply.code(401).send({ message: "No autorizado" });

  try {
    // 1. Verificar si la clínica existe
    const clinic = await ClinicaService.getById(clinicaId);
    if (!clinic) return reply.code(404).send({ message: "Clínica no encontrada" });

    // 2. Si no es Admin, verificar que el veterinario pertenezca activamente a la clínica
    if (user.rol !== 'Admin') {
      const vet = await VetService.getByUsuarioId(user.id);
      if (!vet) {
        return reply.code(400).send({ message: "Perfil de veterinario no encontrado para el usuario actual" });
      }

      const association = await VetService.getAssociationWithClinica(vet.id, clinicaId);
      if (!association) {
        return reply.code(403).send({ message: "No tienes permisos para invitar personal a esta clínica" });
      }
    }

    // 3. Generar token de invitación JWT (válido por 7 días)
    const token = jwt.sign(
      {
        clinicaId,
        invitedBy: user.id,
        type: 'clinic_invitation',
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return reply.code(200).send({
      message: "Invitación generada exitosamente",
      token,
      clinicaId,
      nombreClinica: clinic.nombre_comercial,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return reply.code(500).send({ message });
  }
};

export const update = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  const data = request.body as UpdateVeterinario;

  const isValid = Validation.isSelfVeterinario(request.user, id);
  if (!isValid) return reply.code(403).send({ message: 'No tienes permiso para acceder a este recurso' });

  try {
    const vet = await VetService.update(id, data);
    if (!vet) return reply.code(404).send({ message: 'Veterinario no encontrado' });
    return reply.code(200).send({
      message: 'Veterinario actualizado exitosamente',
      vet
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return reply.code(500).send({ message });
  }
}