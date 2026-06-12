import { FastifyInstance } from "fastify";
import * as controller from "../controllers/tratamientos.controller";
import { checkRole, verifyToken } from "../middlewares/auth.middleware";

export default async function tratamientosRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/mascota/:mascotaId', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getByMascota);
    fastify.patch('/:id', { preHandler: [checkRole(['Admin', 'Veterinario'])] }, controller.update);
}
