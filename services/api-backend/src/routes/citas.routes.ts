import { FastifyInstance } from "fastify";
import * as controller from "../controllers/citas.controller";
import * as horariosController from "../controllers/horarios.controller";
import { checkRole, verifyToken } from "../middlewares/auth.middleware";

export default async function citasRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getAll);
    fastify.get('/disponibilidad', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, horariosController.getDisponibilidad);
    fastify.get('/:id', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getOne);
    fastify.post('/', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.create);
    fastify.patch('/:id', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.update);
}
