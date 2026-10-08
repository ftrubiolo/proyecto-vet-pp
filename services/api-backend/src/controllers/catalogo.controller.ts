import { FastifyRequest, FastifyReply } from 'fastify';
import { CatalogoService } from '../services/catalogo.service';
import { handleControllerError } from '../utils/error-handler';

export const getAllEspecies = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const especies = await CatalogoService.getAllEspecies();
        return reply.code(200).send(especies);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener especies');
    }
};

export const getAllDiagnosticos = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const diagnosticos = await CatalogoService.getAllDiagnosticos();
        return reply.code(200).send(diagnosticos);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener diagnósticos');
    }
};

export const getAllTiposTratamiento = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const tiposTratamiento = await CatalogoService.getAllTiposTratamiento();
        return reply.code(200).send(tiposTratamiento);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener tipos de tratamiento');
    }
};

export const getAllProductos = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const productos = await CatalogoService.getAllProductos();
        return reply.code(200).send(productos);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener productos');
    }
};

export const getAllVacunas = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const vacunas = await CatalogoService.getAllVacunas();
        return reply.code(200).send(vacunas);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener vacunas');
    }
};

export const getAllMedicamentos = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const medicamentos = await CatalogoService.getAllMedicamentos();
        return reply.code(200).send(medicamentos);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener medicamentos');
    }
};

export const getAllMotivosCita = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const motivos = await CatalogoService.getAllMotivosCita();
        return reply.code(200).send(motivos);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener motivos de cita');
    }
};

export const getAllEstadosCita = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const estados = await CatalogoService.getAllEstadosCita();
        return reply.code(200).send(estados);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener estados de cita');
    }
};

export const getAllEstadosPaciente = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const estados = await CatalogoService.getAllEstadosPaciente();
        return reply.code(200).send(estados);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener estados de paciente');
    }
};

export const getAllTiposRelacionMascota = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const tiposRelacion = await CatalogoService.getAllTiposRelacion();
        return reply.code(200).send(tiposRelacion);
    } catch (error) {
        return handleControllerError(error, reply, 'Error al obtener tipos de relación');
    }
};