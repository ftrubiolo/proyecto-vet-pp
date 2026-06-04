import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  // Rutas de autenticación
  fastify.post('/register/veterinario', authController.registrarVeterinario);
  fastify.post('/register/propietario', { schema: registrarPropietarioSchema }, authController.registrarPropietario);
  fastify.post('/login', { schema: loginSchema }, authController.login);
  fastify.post('/logout', authController.logout);
}

const registrarPropietarioSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'rol', 'name', 'lastname', 'isCompany', 'telefono'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      rol: { type: 'string' },
      name: { type: 'string' },
      lastname: { type: 'string' },
      isCompany: { type: 'boolean' },
      companyName: { type: 'string' },
      foto: { type: 'string' },
      telefono: { type: 'string' },
      direccion: { type: 'string' }
    }
  }
};

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' }
    }
  }
};