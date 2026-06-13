import { FastifyInstance } from "fastify/types/instance";
import * as controller from "../controllers/mascotas.controller"
import { checkRole, verifyToken } from "../middlewares/auth.middleware"

export default async function mascotasRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/', { preHandler: [checkRole(['Admin', 'Veterinario', 'Propietario'])] }, controller.getAll);
    fastify.post('/', { schema: createSchema }, controller.create);
    fastify.get('/:id', controller.getOne);
    fastify.patch('/:id', { schema: updateSchema }, controller.update);
    fastify.get('/buscar-existente/:id', { preHandler: [checkRole(['Veterinario', 'Admin'])] }, controller.buscarExistente);
}

const createSchema = {
    body: {
        type: 'object',
        required: ['mascota', 'propietario'],
        properties: {
            mascota: {
                type: 'object',
                properties: {
                    nombre: { type: 'string' },
                    fecha_nacimiento: { type: 'string', format: 'date' },
                    sexo: { type: 'string', enum: ['M', 'H'] },
                    raza_id: { type: 'number' },
                    es_castrado: { type: 'boolean' },
                },
            },
            propietario: {
                type: 'object',
                properties: {
                    propietario_id: { type: 'string' },
                    tipo_relacion_id: { type: 'number' },
                },
                required: ['propietario_id', 'tipo_relacion_id'],
            },
        },
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
            foto_url: { type: 'string' },
            alergias: { type: 'string', nullable: true },
            condiciones_cronicas: { type: 'string', nullable: true },
            contraindicaciones: { type: 'string', nullable: true },
        },
    },
}