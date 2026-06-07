import { FastifyInstance } from "fastify";
import * as catalogoController from "../controllers/catalogo.controller";
import { verifyToken } from "../middlewares/auth.middleware";

export default async function catalogoRoutes(fastify: FastifyInstance) {
    fastify.addHook('preHandler', verifyToken);

    fastify.get('/diagnosticos', catalogoController.getAllDiagnosticos);
    fastify.get('/tipos-tratamiento', catalogoController.getAllTiposTratamiento);

    fastify.get('/productos', catalogoController.getAllProductos);
    fastify.get('/productos/vacunas', catalogoController.getAllVacunas);
    fastify.get('/productos/medicamentos', catalogoController.getAllMedicamentos);

    fastify.get('/especies', catalogoController.getAllEspecies);

    fastify.get('/citas/motivos', catalogoController.getAllMotivosCita);
    fastify.get('/citas/estados', catalogoController.getAllEstadosCita);

    fastify.get('/pacientes/estados', catalogoController.getAllEstadosPaciente);

    fastify.get('/mascotas/tipos-relacion', catalogoController.getAllTiposRelacionMascota);
}