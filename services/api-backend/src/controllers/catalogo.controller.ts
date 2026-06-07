import { FastifyRequest, FastifyReply } from 'fastify';
import { CatalogoService } from '../services/catalogo.service';

/**
 * Obtiene todas las especies
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllEspecies = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const especies = await CatalogoService.getAllEspecies();
        return reply.status(200).send(especies);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener especies', detalle: error.message });
    }
};

/**
 * Obtiene todos los diagnosticos
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllDiagnosticos = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const diagnosticos = await CatalogoService.getAllDiagnosticos();
        return reply.status(200).send(diagnosticos);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener diagnosticos', detalle: error.message });
    }
};

/**
 * Obtiene todos los tipos de tratamiento
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllTiposTratamiento = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const tiposTratamiento = await CatalogoService.getAllTiposTratamiento();
        return reply.status(200).send(tiposTratamiento);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener tipos de tratamiento', detalle: error.message });
    }
};

/**
 * Obtiene todos los productos
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllProductos = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const productos = await CatalogoService.getAllProductos();
        return reply.status(200).send(productos);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener productos', detalle: error.message });
    }
};

/**
 * Obtiene todas las vacunas dentro de productos
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllVacunas = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const vacunas = await CatalogoService.getAllVacunas();
        return reply.status(200).send(vacunas);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener vacunas', detalle: error.message });
    }
};

/**
 * Obtiene todos los medicamentos dentro de productos
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllMedicamentos = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const medicamentos = await CatalogoService.getAllMedicamentos();
        return reply.status(200).send(medicamentos);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener medicamentos', detalle: error.message });
    }
};

/**
 * Obtiene todos los motivos de cita
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllMotivosCita = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const motivos = await CatalogoService.getAllMotivosCita();
        return reply.status(200).send(motivos);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener motivos de cita', detalle: error.message });
    }
};

/**
 * Obtiene todos los estados de cita
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllEstadosCita = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const estados = await CatalogoService.getAllEstadosCita();
        return reply.status(200).send(estados);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener estados de cita', detalle: error.message });
    }
};

/**
 * Obtiene todos los estados de paciente
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllEstadosPaciente = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const estados = await CatalogoService.getAllEstadosPaciente();
        return reply.status(200).send(estados);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener estados de paciente', detalle: error.message });
    }
};

/**
 * Obtiene todos los tipos de relación mascota-propietario
 * @param request - Request de Fastify
 * @param reply - Reply de Fastify
 */
export const getAllTiposRelacionMascota = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const tiposRelacion = await CatalogoService.getAllTiposRelacion();
        return reply.status(200).send(tiposRelacion);
    } catch (error: any) {
        return reply.status(500).send({ error: 'Error al obtener tipos de relación', detalle: error.message });
    }
};