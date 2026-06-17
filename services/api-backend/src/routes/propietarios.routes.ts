import { FastifyInstance } from 'fastify';
import * as controller from '../controllers/propietarios.controller';
import { checkRole, verifyToken } from '../middlewares/auth.middleware';


export default async function propietariosRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get('/', { preHandler: [checkRole(['Admin'])] }, controller.getAll);
  fastify.get('/buscar', { preHandler: [checkRole(['Admin', 'Veterinario'])] }, controller.buscar);
  fastify.get('/mascotas', controller.getAllMascotas)
  fastify.get('/:id', controller.getOne);
  fastify.patch('/:id', { preHandler: [checkRole(['Admin', 'Propietario'])] }, controller.update);
}

