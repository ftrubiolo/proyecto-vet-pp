import { FastifyInstance } from 'fastify';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(fastify: FastifyInstance) {
  // Rutas de autenticación
  fastify.post('/register/veterinario', { schema: registrarVeterinarioSchema }, authController.registrarVeterinario);
  fastify.post('/register/propietario', { schema: registrarPropietarioSchema }, authController.registrarPropietario);
  fastify.post('/register/veterinario/unirse', { schema: registrarVeterinarioUnirseSchema }, authController.registrarVeterinarioUnirse);
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
          nombre_comercial: { type: 'string' },
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
    required: ['usuario', 'propietario'],
    properties: {
      "usuario": {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        }
      },
      "propietario": {
        type: 'object',
        required: ['nombre', 'apellido', 'esEmpresa', 'telefono'],
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          esEmpresa: { type: 'boolean' },
          razonSocial: { type: 'string' },
          foto: { type: 'string' },
          telefono: { type: 'string' },
          direccion: { type: 'string' }
        }
      }
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

const registrarVeterinarioUnirseSchema = {
  body: {
    type: 'object',
    required: [
      "token",
      "usuario",
      "veterinario"
    ],
    properties: {
      "token": { type: 'string' },
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
      }
    }
  }
};