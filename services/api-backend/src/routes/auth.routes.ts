import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  // Rutas de autenticación
  fastify.post('/register/veterinario', authController.registrarVeterinario);
  fastify.post('/register/propietario', authController.registrarPropietario);
  fastify.post('/login', authController.login);
}

