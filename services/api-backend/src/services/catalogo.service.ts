import { db } from '../db';
import { eq } from 'drizzle-orm';
import { catalogo_productos, especies, razas, diagnosticos_atencion, tipos_tratamiento, estados_cita, estados_paciente, tipos_relacion, motivos_cita } from '../db/schema';

export interface EspecieConRaza {
    especie: string;
    raza: string;
}

export type Diagnostico = typeof diagnosticos_atencion.$inferSelect;
export type TipoTratamiento = typeof tipos_tratamiento.$inferSelect;
export type EstadoCita = typeof estados_cita.$inferSelect;
export type EstadoPaciente = typeof estados_paciente.$inferSelect;
export type TipoRelacion = typeof tipos_relacion.$inferSelect;
export type MotivoCita = typeof motivos_cita.$inferSelect;
export type Producto = typeof catalogo_productos.$inferSelect;

/**
 * Servicio para gestionar las consultas a tablas maestras y catálogos globales.
 */
export class CatalogoService {
    /**
     * Obtiene todas las especies con sus razas correspondientes.
     * @returns Lista de especies con sus razas
     */
    static async getAllEspecies(): Promise<EspecieConRaza[]> {
        return await db
            .select({
                especie: especies.especie,
                raza: razas.raza
            })
            .from(especies)
            .innerJoin(razas, eq(especies.id, razas.especie_id));
    }

    /**
     * Obtiene todos los diagnósticos predefinidos.
     * @returns Lista de diagnósticos
     */
    static async getAllDiagnosticos(): Promise<Diagnostico[]> {
        return await db.query.diagnosticos_atencion.findMany();
    }

    /**
     * Obtiene todos los tipos de tratamientos médicos.
     * @returns Lista de tipos de tratamiento
     */
    static async getAllTiposTratamiento(): Promise<TipoTratamiento[]> {
        return await db.query.tipos_tratamiento.findMany();
    }

    /**
     * Obtiene todos los productos (vacunas y medicamentos) en catálogo.
     * @returns Lista de productos
     */
    static async getAllProductos(): Promise<Producto[]> {
        return await db.query.catalogo_productos.findMany();
    }

    /**
     * Obtiene únicamente los productos catalogados como vacunas.
     * @returns Lista de vacunas
     */
    static async getAllVacunas(): Promise<Producto[]> {
        return await db.query.catalogo_productos.findMany({
            where: eq(catalogo_productos.es_vacuna, true),
        });
    }

    /**
     * Obtiene únicamente los productos catalogados como medicamentos.
     * @returns Lista de medicamentos
     */
    static async getAllMedicamentos(): Promise<Producto[]> {
        return await db.query.catalogo_productos.findMany({
            where: eq(catalogo_productos.es_vacuna, false),
        });
    }

    /**
     * Obtiene todos los motivos predefinidos para agendar citas.
     * @returns Lista de motivos de cita
     */
    static async getAllMotivosCita(): Promise<MotivoCita[]> {
        return await db.query.motivos_cita.findMany();
    }

    /**
     * Obtiene todos los estados posibles de una cita.
     * @returns Lista de estados de cita
     */
    static async getAllEstadosCita(): Promise<EstadoCita[]> {
        return await db.query.estados_cita.findMany();
    }

    /**
     * Obtiene todos los estados clínicos del paciente en una clínica.
     * @returns Lista de estados de paciente
     */
    static async getAllEstadosPaciente(): Promise<EstadoPaciente[]> {
        return await db.query.estados_paciente.findMany();
    }

    /**
     * Obtiene todos los tipos de relación entre mascotas y propietarios.
     * @returns Lista de tipos de relación
     */
    static async getAllTiposRelacion(): Promise<TipoRelacion[]> {
        return await db.query.tipos_relacion.findMany();
    }
}
