import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  // Rutas de autenticación
  fastify.post('/registro/veterinario', authController.registrarVeterinario);
  fastify.post('/registro/propietario', authController.registrarPropietario);
  fastify.post('/login', authController.login);
}

