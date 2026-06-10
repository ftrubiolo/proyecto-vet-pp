import { FastifyInstance } from 'fastify';
import * as controller from '../controllers/propietarios.controller';
import { checkRole, verifyToken } from '../middlewares/auth.middleware';


export default async function propietariosRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', { preHandler: [checkRole(['Admin'])] }, controller.getAll);
  fastify.get('/:id', controller.getOne);
  fastify.patch('/:id', { preHandler: [checkRole(['Admin', 'Propietario'])] }, controller.update);
}

