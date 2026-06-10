import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';
import * as controller from '../controllers/usuarios.controller';


export default async function usuariosRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  fastify.get("/", { preHandler: checkRole(['Admin']) }, controller.getAll);
  fastify.get("/me", controller.getMe);
  fastify.get("/:id", { preHandler: checkRole(['Admin']) }, controller.getOne);

  fastify.patch("/:id", { schema: updateSchema }, controller.update);
  fastify.delete("/:id", { preHandler: checkRole(['Admin']) }, controller.remove);
}

const updateSchema = {
  body: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 }
    }
  }
};