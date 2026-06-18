import { FastifyInstance } from "fastify";
import * as controller from "../controllers/ai.controller";
import { verifyToken } from "../middlewares/auth.middleware";

export default async function aiRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.post('/chat', controller.chat);
    fastify.post('/pdf', controller.downloadChatPdf);
}
