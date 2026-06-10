import { db } from '../db';
import { eq } from 'drizzle-orm';
import { clinicas } from '../db/schema';

import type { ClinicaDb, NewClinica, DBClient } from '../types/db.types';

/**
 * Servicio para la gestión de clínicas veterinarias.
 */
export class ClinicaService {
    /**
     * Obtiene todas las clínicas.
     * @returns Array de clínicas -> {@link ClinicaDb}
     */
    static async getAll(): Promise<ClinicaDb[]> {
        const result = await db.query.clinicas.findMany();
        return result;
    }

    /**
     * Obtiene una clínica por ID.
     * @param id - ID de la clínica
     * @returns Clínica encontrada -> {@link ClinicaDb} o null si no existe
     */
    static async getById(id: string): Promise<ClinicaDb | null> {
        const result = await db.query.clinicas.findFirst({
            where: eq(clinicas.id, id),
        });
        if (!result) return null;
        return result;
    }

    /**
     * Verifica si una clínica existe.
     * @param id - ID de la clínica
     * @returns True si la clínica existe, false en caso contrario
     */
    static async exists(id: string): Promise<boolean> {
        const result = await db.query.clinicas.findFirst({
            where: eq(clinicas.id, id),
            columns: { id: true }
        });
        return !!result;
    }

    /**
     * Crea una nueva clínica.
     * @param data - Datos de la clínica (insert type)
     * @param tx - Transacción de base de datos (opcional)
     * @returns Clínica creada -> {@link ClinicaDb}
     */
    static async create(data: NewClinica, tx?: DBClient): Promise<ClinicaDb> {
        const client = tx || db;
        const [newClinica] = await client.insert(clinicas).values(data).returning();
        return newClinica;
    }
}