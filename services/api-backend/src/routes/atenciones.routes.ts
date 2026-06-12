import { FastifyInstance } from "fastify";
import * as controller from "../controllers/atenciones.controller";
import { checkRole, verifyToken } from "../middlewares/auth.middleware";

export default async function atencionesRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/mascota/:mascotaId', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getByMascota);
    fastify.post('/', { preHandler: [checkRole(['Admin', 'Veterinario'])] }, controller.create);
}
