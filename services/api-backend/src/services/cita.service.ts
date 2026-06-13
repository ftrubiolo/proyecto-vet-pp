import { db } from "../db";
import { and, eq, inArray } from "drizzle-orm";
import { citas, veterinarios_clinicas, mascotas_propietarios } from "../db/schema";
import type { NewCita, UpdateCita, CitaDb } from "../types/db.types";

/**
 * Servicio para manejar las citas médicas de las mascotas.
 */
export class CitaService {
    /**
     * Obtiene todas las citas médicas.
     * @returns Array de citas médicas
     */
    static async getAll(): Promise<CitaDb[] | null> {
        return await db.query.citas.findMany({
            with: {
                mascota: true,
                veterinario: true,
                clinica: true,
                estado_cita: true,
                motivo_cita: true,
                atenciones: true,
            },
            orderBy: (citas, { asc }) => [asc(citas.fecha_hora)],
        }) as any[];
    }

    /**
     * Obtiene todas las citas médicas de un veterinario.
     * @param vetId - ID del veterinario
     * @returns Array de citas médicas
     */
    static async getByVeterinarioId(vetId: string): Promise<CitaDb[] | null> {
        const clinicaIds = await db.query.veterinarios_clinicas.findMany({
            where: and(
                eq(veterinarios_clinicas.veterinario_id, vetId),
                eq(veterinarios_clinicas.estado_activo, true)
            ),
            columns: {
                clinica_id: true
            }
        });

        if (!clinicaIds || clinicaIds.length === 0) return [];
        const ids = clinicaIds.map(c => c.clinica_id as string);

        return await db.query.citas.findMany({
            where: inArray(citas.clinica_id, ids),
            with: {
                mascota: true,
                veterinario: true,
                clinica: true,
                estado_cita: true,
                motivo_cita: true,
                atenciones: true,
            },
            orderBy: (citas, { asc }) => [asc(citas.fecha_hora)],
        }) as any[];
    }

    /**
     * Obtiene todas las citas médicas de un propietario.
     * @param proId - ID del propietario
     * @returns Array de citas médicas
     */
    static async getByPropietarioId(proId: string): Promise<CitaDb[] | null> {
        const ownerMascotas = await db.query.mascotas_propietarios.findMany({
            where: and(
                eq(mascotas_propietarios.propietario_id, proId),
                eq(mascotas_propietarios.activo, true)
            ),
            columns: {
                mascota_id: true
            }
        });

        if (!ownerMascotas || ownerMascotas.length === 0) return [];
        const mascotaIds = ownerMascotas.map(om => om.mascota_id as string);

        return await db.query.citas.findMany({
            where: inArray(citas.mascota_id, mascotaIds),
            with: {
                mascota: true,
                veterinario: true,
                clinica: true,
                estado_cita: true,
                motivo_cita: true,
                atenciones: true,
            },
            orderBy: (citas, { asc }) => [asc(citas.fecha_hora)],
        }) as any[];
    }

    /**
     * Obtiene una cita médica por ID.
     * @param id - ID de la cita médica
     * @returns Objeto de la cita médica
     */
    static async getById(id: string): Promise<CitaDb | null> {
        const result = await db.query.citas.findFirst({
            where: eq(citas.id, id),
            with: {
                mascota: true,
                veterinario: true,
                clinica: true,
                estado_cita: true,
                motivo_cita: true,
                atenciones: true,
            }
        });
        return result || null;
    }

    /**
     * Crea una nueva cita médica.
     * @param data - Datos de la cita médica
     * @returns Objeto de la cita médica creada
     */
    static async create(data: NewCita): Promise<CitaDb> {
        const dateObject = new Date(data.fecha_hora);
        data.fecha_hora = dateObject;

        // Default to "Agendada" state (id = 1) if not provided
        if (!data.estado_cita_id) {
            data.estado_cita_id = 1;
        }

        const [newCita] = await db
            .insert(citas)
            .values(data)
            .returning();
        return newCita;
    }

    /**
     * Actualiza una cita médica.
     * @param id - ID de la cita médica
     * @param data - Datos de la cita médica a actualizar
     * @returns Objeto de la cita médica actualizada
     */
    static async update(id: string, data: UpdateCita): Promise<CitaDb | null> {
        if (data.fecha_hora) {
            data.fecha_hora = new Date(data.fecha_hora);
        }
        const [updated] = await db
            .update(citas)
            .set(data)
            .where(eq(citas.id, id))
            .returning();
        return updated || null;
    }
}
