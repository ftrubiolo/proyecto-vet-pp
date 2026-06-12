
import { FastifyInstance } from "fastify/types/instance";
import * as controller from "../controllers/clinicas.controller"
import { checkRole, verifyToken } from "../middlewares/auth.middleware"

export default async function clinicasRoutes(fastify: FastifyInstance) {
    fastify.addHook("preHandler", verifyToken)

    fastify.get("/", controller.getAll)
    fastify.get("/:id", controller.getOne)
    fastify.post('/:id/admision', controller.admision)
    fastify.post('/', controller.create)
    fastify.patch('/:id', { preHandler: checkRole(['Admin']) }, controller.update)
}