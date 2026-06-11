import { FastifyInstance } from "fastify/types/instance";
import * as controller from "../controllers/mascotas.controller"
import { checkRole, verifyToken } from "../middlewares/auth.middleware"
import { format } from "node:path";

export default async function mascotasRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/', { preHandler: [checkRole(['Admin'])] }, controller.getAll);
    fastify.post('/', { schema: createSchema }, controller.create);
    fastify.get('/:id', controller.getOne);
    fastify.patch('/:id', { schema: updateSchema }, controller.update);
}

const createSchema = {
    body: {
        type: 'object',
        properties: {
            nombre: { type: 'string' },
            fecha_nacimiento: { type: 'string', format: 'date' },
            sexo: { type: 'string', enum: ['M', 'H'] },
            raza_id: { type: 'number' },
            es_castrado: { type: 'boolean' },
            numero_microchip: { type: 'string' },
            propietarios: {
                type: 'array', items: {
                    type: 'object',
                    properties: {
                        propietario_id: { type: 'string' },
                        tipo_relacion_id: { type: 'number' },
                    },
                    required: ['propietario_id', 'tipo_relacion_id'],
                }
            },
        },
        required: ['nombre', 'fecha_nacimiento', 'sexo', 'raza_id', 'propietarios'],
    },
}

const updateSchema = {
    body: {
        type: 'object',
        properties: {
            nombre: { type: 'string' },
            fecha_nacimiento: { type: 'string', format: 'date' },
            sexo: { type: 'string', enum: ['M', 'H'] },
            raza_id: { type: 'number' },
            es_castrado: { type: 'boolean' },
            numero_microchip: { type: 'string' },
        },
        required: ['nombre', 'fecha_nacimiento', 'sexo', 'raza_id'],
    },
}