import { FastifyInstance } from "fastify";
import * as controller from "../controllers/vacunas.controller";
import { checkRole, verifyToken } from "../middlewares/auth.middleware";

export default async function vacunasRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/mascota/:mascotaId', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getByMascota);
    
    // Rutas para la curación de protocolos de vacunas
    fastify.get('/protocolo/producto/:productoId', { preHandler: [checkRole(['Admin', 'Veterinario'])] }, controller.getProtocoloByProductoId);
    fastify.post('/protocolo', { preHandler: [checkRole(['Admin', 'Veterinario'])] }, controller.createProtocolo);
}
