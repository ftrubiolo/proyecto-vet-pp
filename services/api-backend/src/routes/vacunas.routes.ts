import { FastifyInstance } from "fastify";
import * as controller from "../controllers/vacunas.controller";
import { checkRole, verifyToken } from "../middlewares/auth.middleware";

export default async function vacunasRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/mascota/:mascotaId', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getByMascota);
}
