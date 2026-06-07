import { db } from '../db';
import { eq } from 'drizzle-orm';
import { clinicas } from '../db/schema';

export type Clinica = typeof clinicas.$inferSelect;
export type NewClinica = typeof clinicas.$inferInsert;
type DBClient = typeof db | any;

/**
 * Servicio para la gestión de clínicas veterinarias.
 */
export class ClinicaService {
    /**
     * Obtiene todas las clínicas.
     * @returns Array de clínicas -> {@link Clinica}
     */
    static async getAll(): Promise<Clinica[]> {
        const result = await db.query.clinicas.findMany();
        return result;
    }

    /**
     * Obtiene una clínica por ID.
     * @param id - ID de la clínica
     * @returns Clínica encontrada -> {@link Clinica} o null si no existe
     */
    static async getById(id: string): Promise<Clinica | null> {
        const result = await db.query.clinicas.findFirst({
            where: eq(clinicas.id, id),
        });
        if (!result) return null;
        return result;
    }

    /**
     * Crea una nueva clínica.
     * @param data - Datos de la clínica (insert type)
     * @param tx - Transacción de base de datos (opcional)
     * @returns Clínica creada -> {@link Clinica}
     */
    static async create(data: NewClinica, tx?: DBClient): Promise<Clinica> {
        const client = tx || db;
        const [newClinica] = await client.insert(clinicas).values(data).returning();
        return newClinica;
    }
}