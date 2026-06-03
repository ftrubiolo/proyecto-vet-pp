import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import veterinariosRoutes from './veterinarios.routes';
import propietariosRoutes from './propietarios.routes';
import usuariosRoutes from './usuarios.routes';

export default async function apiRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(veterinariosRoutes, { prefix: '/veterinarios' });
  await fastify.register(propietariosRoutes, { prefix: '/propietarios' });
  await fastify.register(usuariosRoutes, { prefix: '/usuarios' });
}