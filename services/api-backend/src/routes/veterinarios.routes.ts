import { FastifyInstance } from 'fastify';
import * as veterinariosController from '../controllers/veterinarios.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';

export default async function veterinariosRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', { preHandler: [checkRole(['Admin'])] }, veterinariosController.getAll);
  fastify.get('/:id', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, veterinariosController.getOne);
  fastify.post('/invitar', {
    preHandler: [checkRole(['Veterinario', 'Admin'])],
    schema: generarInvitacionSchema
  }, veterinariosController.generarInvitacion);
  fastify.patch('/:id', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, veterinariosController.update);
}

const generarInvitacionSchema = {
  body: {
    type: 'object',
    required: ['clinicaId'],
    properties: {
      clinicaId: { type: 'string', format: 'uuid' }
    }
  }
};

