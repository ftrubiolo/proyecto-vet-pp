import { db } from '../db';
import { eq, and, isNull } from 'drizzle-orm';
import { catalogo_productos, especies, razas, diagnosticos_atencion, tipos_tratamiento, estados_cita, estados_paciente, tipos_relacion, motivos_cita, productos_categorias } from '../db/schema';

export interface EspecieConRaza {
    especie: string;
    raza: string;
}

export type DiagnosticoDb = typeof diagnosticos_atencion.$inferSelect;
export type TipoTratamientoDb = typeof tipos_tratamiento.$inferSelect;
export type EstadoCitaDb = typeof estados_cita.$inferSelect;
export type EstadoPacienteDb = typeof estados_paciente.$inferSelect;
export type TipoRelacionDb = typeof tipos_relacion.$inferSelect;
export type MotivoCitaDb = typeof motivos_cita.$inferSelect;
export type ProductoDb = typeof catalogo_productos.$inferSelect;

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
    static async getAllDiagnosticos(): Promise<DiagnosticoDb[]> {
        return await db.query.diagnosticos_atencion.findMany();
    }

    /**
     * Obtiene todos los tipos de tratamientos médicos.
     * @returns Lista de tipos de tratamiento
     */
    static async getAllTiposTratamiento(): Promise<TipoTratamientoDb[]> {
        return await db.query.tipos_tratamiento.findMany();
    }

    /**
     * Obtiene todos los productos (vacunas y medicamentos) en catálogo.
     * @returns Lista de productos
     */
    static async getAllProductos(): Promise<ProductoDb[]> {
        return await db.query.catalogo_productos.findMany();
    }

    /**
     * Obtiene únicamente los productos catalogados como vacunas.
     * @returns Lista de vacunas
     */
    static async getAllVacunas(): Promise<ProductoDb[]> {
        return await db
            .select({
                id: catalogo_productos.id,
                numero_senasa: catalogo_productos.numero_senasa,
                nombre_comercial: catalogo_productos.nombre_comercial,
                nombre_firma: catalogo_productos.nombre_firma
            })
            .from(catalogo_productos)
            .innerJoin(
                productos_categorias,
                eq(catalogo_productos.id, productos_categorias.producto_id)
            )
            .where(eq(productos_categorias.categoria_id, 21));
    }

    /**
     * Obtiene únicamente los productos catalogados como medicamentos.
     * @returns Lista de medicamentos
     */
    static async getAllMedicamentos(): Promise<ProductoDb[]> {
        return await db
            .select({
                id: catalogo_productos.id,
                numero_senasa: catalogo_productos.numero_senasa,
                nombre_comercial: catalogo_productos.nombre_comercial,
                nombre_firma: catalogo_productos.nombre_firma
            })
            .from(catalogo_productos)
            .leftJoin(
                productos_categorias,
                and(
                    eq(catalogo_productos.id, productos_categorias.producto_id),
                    eq(productos_categorias.categoria_id, 21)
                )
            )
            .where(isNull(productos_categorias.categoria_id));
    }

    /**
     * Obtiene todos los motivos predefinidos para agendar citas.
     * @returns Lista de motivos de cita
     */
    static async getAllMotivosCita(): Promise<MotivoCitaDb[]> {
        return await db.query.motivos_cita.findMany();
    }

    /**
     * Obtiene todos los estados posibles de una cita.
     * @returns Lista de estados de cita
     */
    static async getAllEstadosCita(): Promise<EstadoCitaDb[]> {
        return await db.query.estados_cita.findMany();
    }

    /**
     * Obtiene todos los estados clínicos del paciente en una clínica.
     * @returns Lista de estados de paciente
     */
    static async getAllEstadosPaciente(): Promise<EstadoPacienteDb[]> {
        return await db.query.estados_paciente.findMany();
    }

    /**
     * Obtiene todos los tipos de relación entre mascotas y propietarios.
     * @returns Lista de tipos de relación
     */
    static async getAllTiposRelacion(): Promise<TipoRelacionDb[]> {
        return await db.query.tipos_relacion.findMany();
    }
}
