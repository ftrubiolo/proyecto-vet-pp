import { db } from "../db";
import { eq } from "drizzle-orm";
import { vacuna_serie, vacuna_protocolo, catalogo_productos } from "../db/schema";

/**
 * Servicio para manejar las vacunas de las mascotas y protocolos.
 */
export class VacunaService {
    /**
     * Obtiene todas las series de vacunas de una mascota con sus dosis y protocolos.
     * @param mascotaId - ID de la mascota
     * @returns Array de series de vacunas
     */
    static async getByMascotaId(mascotaId: string): Promise<any[]> {
        return await db.query.vacuna_serie.findMany({
            where: eq(vacuna_serie.mascota_id, mascotaId),
            with: {
                dosis: {
                    orderBy: (dosis, { asc }) => [asc(dosis.numero_dosis)]
                },
                protocolo: true,
            }
        }) as any[];
    }

    /**
     * Obtiene el protocolo de una vacuna por ID de producto.
     * Si no existe en la base de datos local, consulta la API de SENASA para pre-cargar la información.
     * @param productoId - ID del producto en el catálogo
     * @returns Información del protocolo y si ya está curado
     */
    static async getProtocoloByProductoId(productoId: number): Promise<any> {
        // 1. Intentar buscar el protocolo local curado
        const localProtocolo = await db.query.vacuna_protocolo.findFirst({
            where: eq(vacuna_protocolo.senasa_id, productoId)
        });

        if (localProtocolo) {
            return {
                isCurated: true,
                protocolo: localProtocolo
            };
        }

        // 2. Si no existe, buscar el nombre comercial en el catálogo local
        const catalogoProd = await db.query.catalogo_productos.findFirst({
            where: eq(catalogo_productos.id, productoId)
        });

        const defaultProtocolo = {
            senasa_id: productoId,
            numero_inscripcion: catalogoProd?.numero_senasa || '',
            nombre_comercial: catalogoProd?.nombre_comercial || '',
            observaciones: '',
            indicaciones_y_vias: '',
            especies_target: [] as string[],
            dosificacion_por_esp: {} as Record<string, string>,
            vias_administracion: [] as string[],
            fecha_validez: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            producto_registrado: true,
            total_dosis_serie_primaria: 1,
            intervalo_dias: [] as number[],
            tiene_refuerzo: false,
            refuerzo_cada_dias: null as number | null
        };

        // 3. Consultar la API externa de SENASA
        try {
            console.log(`Consultando API de SENASA para el producto ID ${productoId}...`);
            const senasaUrl = `https://aps2.senasa.gov.ar/adt_api/api/productosFarmacos/search/publicSearchProducto?producto=https%3A%2F%2Faps2.senasa.gov.ar%2Fadt_api%2Fapi%2FproductosFarmacos%2F${productoId}&projection=productoFarmacoDetallePublicoProjection`;

            const response = await fetch(senasaUrl);
            if (!response.ok) {
                console.warn(`API de SENASA respondió con estado: ${response.status}`);
                return { isCurated: false, protocolo: defaultProtocolo };
            }

            const data = (await response.json()) as any;
            const productoDetalle = data.productosFarmacoViaPorProducto?.[0]?.producto || data.productoEspecieCategoria?.[0]?.producto;

            if (productoDetalle) {
                // Extraer vías de administración
                const vias = Array.from(
                    new Map(
                        (data.productosFarmacoViaPorProducto || [])
                            .filter((v: any) => v.farmacoVia?.viaAdministracion)
                            .map((v: any) => [v.farmacoVia.viaAdministracion, v.farmacoVia.viaAdministracion])
                    ).values()
                ) as string[];

                // Extraer especies target
                const especies = Array.from(
                    new Map(
                        (data.productoEspecieCategoria || [])
                            .filter((e: any) => e.especie?.descripcion)
                            .map((e: any) => [e.especie.descripcion, e.especie.descripcion])
                    ).values()
                ) as string[];

                // Extraer dosificaciones por especie
                const dosificacion: Record<string, string> = {};
                if (data.productoEspecieCategoria) {
                    for (const item of data.productoEspecieCategoria) {
                        if (item.especie?.descripcion && item.dosificacion) {
                            const key = item.especie.descripcion.toLowerCase();
                            dosificacion[key] = item.dosificacion;
                        }
                    }
                }

                const parsedProtocolo = {
                    senasa_id: productoId,
                    numero_inscripcion: productoDetalle.numeroInscripcion || defaultProtocolo.numero_inscripcion,
                    nombre_comercial: defaultProtocolo.nombre_comercial,
                    observaciones: productoDetalle.observaciones || '',
                    indicaciones_y_vias: productoDetalle.indicacionesYVias || '',
                    especies_target: especies,
                    dosificacion_por_esp: dosificacion,
                    vias_administracion: vias,
                    fecha_validez: productoDetalle.fechaValidez
                        ? new Date(productoDetalle.fechaValidez).toISOString()
                        : defaultProtocolo.fecha_validez,
                    producto_registrado: productoDetalle.productoRegistrado !== undefined
                        ? productoDetalle.productoRegistrado
                        : true,
                    total_dosis_serie_primaria: 1,
                    intervalo_dias: [] as number[],
                    tiene_refuerzo: false,
                    refuerzo_cada_dias: null as number | null
                };

                return {
                    isCurated: false,
                    protocolo: parsedProtocolo
                };
            }
        } catch (error) {
            console.error('❌ Error al consultar la API de SENASA:', error);
        }

        return {
            isCurated: false,
            protocolo: defaultProtocolo
        };
    }

    /**
     * Guarda un protocolo curado en la base de datos.
     * @param data - Datos del protocolo curado
     * @returns Protocolo creado
     */
    static async createProtocolo(data: any): Promise<any> {
        // Asegurarse de parsear correctamente las fechas
        const formattedData = {
            ...data,
            fecha_validez: data.fecha_validez ? new Date(data.fecha_validez) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        };

        const [inserted] = await db.insert(vacuna_protocolo)
            .values({
                senasa_id: formattedData.senasa_id,
                numero_inscripcion: formattedData.numero_inscripcion,
                nombre_comercial: formattedData.nombre_comercial,
                observaciones: formattedData.observaciones,
                indicaciones_y_vias: formattedData.indicaciones_y_vias,
                especies_target: formattedData.especies_target,
                dosificacion_por_esp: formattedData.dosificacion_por_esp,
                vias_administracion: formattedData.vias_administracion,
                fecha_validez: formattedData.fecha_validez,
                total_dosis_serie_primaria: formattedData.total_dosis_serie_primaria,
                intervalo_dias: formattedData.intervalo_dias,
                tiene_refuerzo: formattedData.tiene_refuerzo,
                refuerzo_cada_dias: formattedData.refuerzo_cada_dias
            })
            .returning();

        return inserted;
    }
}
