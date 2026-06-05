import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  // Rutas de autenticación
  fastify.post('/register/veterinario', { schema: registrarVeterinarioSchema }, authController.registrarVeterinario);
  fastify.post('/register/propietario', { schema: registrarPropietarioSchema }, authController.registrarPropietario);
  fastify.post('/login', { schema: loginSchema }, authController.login);
  fastify.post('/logout', authController.logout);
}

const registrarVeterinarioSchema = {
  body: {
    type: 'object',
    required: [
      "usuario",
      "veterinario",
      "clinica"
    ],
    properties: {
      "usuario": {
        type: 'object',
        required: ['email', 'password', 'rol'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          rol: { type: 'string' }
        }
      },
      "veterinario": {
        type: 'object',
        required: ['nombre', 'apellido', 'numero_matricula', 'telefono'],
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          foto: { type: 'string' },
          numero_matricula: { type: 'string' },
          telefono: { type: 'string' }
        }
      },
      "clinica": {
        type: 'object',
        required: ['nombre', 'direccion', 'telefono'],
        properties: {
          nombre: { type: 'string' },
          direccion: { type: 'string' },
          telefono: { type: 'string' }
        }
      }
    }
  }
};

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