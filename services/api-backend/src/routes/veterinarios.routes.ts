import { FastifyInstance } from 'fastify';
import { obtenerPerfil } from '../controllers/veterinarios.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';

export default async function veterinariosRoutes(fastify: FastifyInstance) {
  // Rutas de veterinarios
  fastify.get('/:id', {
    preHandler: [verifyToken, checkRole(['Veterinario'])]
  }, obtenerPerfil);
}

