import { FastifyInstance } from 'fastify';
import * as uploadController from '../controllers/upload.controller';
import { verifyToken } from '../middlewares/auth.middleware';

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', verifyToken);

  fastify.post('/', uploadController.uploadFile);
}
