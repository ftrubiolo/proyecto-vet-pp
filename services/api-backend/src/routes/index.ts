import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import veterinariosRoutes from './veterinarios.routes';
import propietariosRoutes from './propietarios.routes';
import usuariosRoutes from './usuarios.routes';
import catalogoRoutes from './catalogo.routes';
import mascotasRoutes from './mascotas.routes';
import clinicasRoutes from './clinicas.routes';

/**
 * Registra y centraliza todas las rutas del API Backend de VetVault con sus respectivos prefijos.
 * 
 * ### Prefijos Registrados:
 * - `/auth` - Gestión de sesiones y registro de usuarios (veterinarios/propietarios) -> {@link authRoutes}
 * - `/veterinarios` - Fichas, perfiles e invitaciones de veterinarios -> {@link veterinariosRoutes}
 * - `/propietarios` - Información de tutores y dueños de mascotas -> {@link propietariosRoutes}
 * - `/usuarios` - Listado y detalles de la cuenta de usuario/sesión -> {@link usuariosRoutes}
 * - `/catalogo` - Tablas maestras e información de consulta / lookups (razas, productos, motivos, etc) -> {@link catalogoRoutes}
 * 
 * @param fastify - Instancia del servidor de Fastify
 */
export default async function apiRoutes(fastify: FastifyInstance) {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(veterinariosRoutes, { prefix: '/veterinarios' });
  await fastify.register(propietariosRoutes, { prefix: '/propietarios' });
  await fastify.register(usuariosRoutes, { prefix: '/usuarios' });
  await fastify.register(catalogoRoutes, { prefix: '/catalogo' });
  await fastify.register(mascotasRoutes, { prefix: '/mascotas' });
  await fastify.register(clinicasRoutes, { prefix: '/clinicas' });
}