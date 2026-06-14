import 'dotenv/config';
import { db } from './index';
import { eq } from 'drizzle-orm';
import { vacunas, vacuna_protocolo, vacuna_serie, vacuna_dosis, catalogo_productos, veterinarios } from './schema';

async function main() {
  console.log('⏳ Iniciando migración de datos de vacunas...');

  // 1. Obtener todas las vacunas heredadas
  const legacyVaccines = await db.select().from(vacunas);
  console.log(`Se encontraron ${legacyVaccines.length} registros planos de vacunas.`);

  if (legacyVaccines.length === 0) {
    console.log('✅ No hay vacunas heredadas para migrar.');
    process.exit(0);
  }

  // 2. Obtener un veterinario por defecto para usar de fallback si es necesario
  const firstVet = await db.query.veterinarios.findFirst();
  const fallbackVetId = firstVet?.id;

  if (!fallbackVetId) {
    console.error('❌ Error: No se encontraron veterinarios en la base de datos para usar de fallback.');
    process.exit(1);
  }

  // 3. Agrupar registros por producto para crear los protocolos correspondientes
  const productIds = Array.from(new Set(legacyVaccines.map(v => v.producto_id)));
  console.log(`Procesando protocolos para ${productIds.length} productos únicos...`);

  await db.transaction(async (tx) => {
    for (const productoId of productIds) {
      // Verificar si ya existe el protocolo
      const existingProto = await tx.query.vacuna_protocolo.findFirst({
        where: eq(vacuna_protocolo.senasa_id, productoId)
      });

      if (!existingProto) {
        // Buscar detalles del producto en el catálogo
        const prod = await tx.query.catalogo_productos.findFirst({
          where: eq(catalogo_productos.id, productoId)
        });

        // Determinar si alguna de las dosis tiene fecha de próxima dosis registrada
        const hasNextDose = legacyVaccines.some(v => v.producto_id === productoId && v.fecha_proxima_dosis !== null);

        const validez = new Date();
        validez.setFullYear(validez.getFullYear() + 1); // 1 año desde hoy por defecto

        await tx.insert(vacuna_protocolo).values({
          senasa_id: productoId,
          numero_inscripcion: prod?.numero_senasa || 'MIGRADO',
          nombre_comercial: prod?.nombre_comercial || 'Vacuna Migrada',
          observaciones: 'Migrado de base de datos plana',
          indicaciones_y_vias: 'Migrado',
          especies_target: ['CANINOS', 'FELINOS'],
          dosificacion_por_esp: {},
          vias_administracion: ['SUBCUTANEA'],
          fecha_validez: validez,
          total_dosis_serie_primaria: 1,
          intervalo_dias: [],
          tiene_refuerzo: hasNextDose,
          refuerzo_cada_dias: hasNextDose ? 365 : null,
        });
        console.log(`✅ Protocolo creado para el producto ID ${productoId} (${prod?.nombre_comercial})`);
      }
    }

    // 4. Agrupar vacunas heredadas por (mascota_id, producto_id)
    const groups: Record<string, typeof legacyVaccines> = {};
    for (const v of legacyVaccines) {
      const key = `${v.mascota_id}_${v.producto_id}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(v);
    }

    console.log(`Agrupamiento completo. Encontradas ${Object.keys(groups).length} series de mascota-producto.`);

    for (const key of Object.keys(groups)) {
      const group = groups[key];
      // Ordenar cronológicamente por fecha de aplicación
      group.sort((a, b) => new Date(a.fecha_aplicacion).getTime() - new Date(b.fecha_aplicacion).getTime());

      const earliest = group[0];
      const latest = group[group.length - 1];

      const vetId = earliest.veterinario_id || fallbackVetId;

      // Crear la vacuna_serie
      const [serie] = await tx.insert(vacuna_serie).values({
        protocolo_id: earliest.producto_id,
        mascota_id: earliest.mascota_id,
        veterinario_id: vetId,
        fecha_inicio: earliest.fecha_aplicacion,
        estado_serie: 'completa',
        dosis_aplicadas: group.length,
        proximo_refuerzo: latest.fecha_proxima_dosis,
      }).returning();

      // Crear vacuna_dosis para cada aplicación de la serie
      for (let i = 0; i < group.length; i++) {
        const item = group[i];
        await tx.insert(vacuna_dosis).values({
          serie_id: serie.id,
          atencion_id: item.atencion_id || null,
          numero_dosis: i + 1,
          fecha_aplicacion: item.fecha_aplicacion,
          lote: item.numero_lote || 'MIGRADO',
          via_administracion: 'Subcutánea',
          observaciones: 'Migrado de registro plano',
        });
      }
      console.log(`✅ Serie migrada para Mascota ID ${earliest.mascota_id} y Producto ID ${earliest.producto_id} (${group.length} dosis)`);
    }
  });

  console.log('🎉 Migración de vacunas completada con éxito.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error durante la migración de vacunas:', err);
  process.exit(1);
});
