import { FastifyInstance } from 'fastify';
import * as veterinariosController from '../controllers/veterinarios.controller';
import * as horariosController from '../controllers/horarios.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';

export default async function veterinariosRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, veterinariosController.getAll);
  fastify.get('/:id', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, veterinariosController.getOne);
  fastify.post('/invitar', {
    preHandler: [checkRole(['Veterinario', 'Admin'])],
    schema: generarInvitacionSchema
  }, veterinariosController.generarInvitacion);
  fastify.get('/clinica/:clinicaId', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, veterinariosController.getByClinica);
  fastify.patch('/:id', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, veterinariosController.update);
  fastify.get('/:id/horarios', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, horariosController.getHorarios);
  fastify.put('/:id/clinicas/:clinicaId/horarios', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, horariosController.updateHorarios);
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

