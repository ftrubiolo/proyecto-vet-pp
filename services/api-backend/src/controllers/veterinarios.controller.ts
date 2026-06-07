import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { clinicas } from '../db/schema';
import { VetService } from '../services/vet.service';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const obtenerPerfil = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { id } = request.params as { id: string };
  try {
    const vet = await VetService.getById(id);
    if (!vet) {
      return reply.code(404).send({ message: "Veterinario no encontrado" });
    }
    return reply.code(200).send(vet);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return reply.code(500).send({ message });
  }
};

export const generarInvitacion = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const { clinicaId } = request.body as { clinicaId: string };
  const user = request.user;
  if (!user) {
    return reply.code(401).send({ message: "No autorizado" });
  }

  try {
    // 1. Verificar si la clínica existe
    const clinic = await db.query.clinicas.findFirst({
      where: eq(clinicas.id, clinicaId),
    });
    if (!clinic) {
      return reply.code(404).send({ message: "Clínica no encontrada" });
    }

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