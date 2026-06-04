import { FastifyInstance } from 'fastify';
import * as controller from '../controllers/propietarios.controller';


export default async function propietariosRoutes(fastify: FastifyInstance) {
  fastify.get('/', controller.getAll);
  fastify.get('/:id', controller.getOne);
  fastify.patch('/:id', controller.update);
  fastify.delete('/:id', controller.remove);
}

