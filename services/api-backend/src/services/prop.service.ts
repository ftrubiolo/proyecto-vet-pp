import { db } from "../db";
import { eq } from "drizzle-orm";
import { propietarios } from "../db/schema";

export type Propietario = typeof propietarios.$inferSelect;
export type NewPropietario = typeof propietarios.$inferInsert;
type DBClient = typeof db | any;

/**
 * Servicio para la gestión de propietarios.
 */
export class PropietarioService {
    /**
     * Obtiene un propietario por ID de usuario.
     * @param usuarioId - ID del usuario
     * @returns Propietario encontrado -> {@link Propietario} o null si no existe
     */
    static async getByUsuarioId(usuarioId: string): Promise<Propietario | null> {
        const result = await db.query.propietarios.findFirst({
            where: eq(propietarios.usuario_id, usuarioId),
        });
        if (!result) return null;
        return result;
    }

    /**
     * Verifica si un propietario está registrado para un usuario.
     * @param usuarioId - ID del usuario a verificar
     * @returns true si el propietario existe, false en caso contrario
     */
    static async existsByUsuarioId(usuarioId: string): Promise<boolean> {
        const propietario = await this.getByUsuarioId(usuarioId);
        return !!propietario;
    }

    /**
     * Crea un nuevo propietario.
     * @param data - Datos del nuevo propietario (insert type)
     * @param tx - Cliente de base de datos o transacción (opcional)
     * @returns El propietario creado
     */
    static async create(data: NewPropietario, tx?: DBClient): Promise<Propietario> {
        const client = tx || db;
        const [newPropietario] = await client.insert(propietarios).values(data).returning();
        return newPropietario;
    }

    /**
     * Actualiza un propietario existente.
     * @param usuarioId - ID del usuario del propietario
     * @param data - Datos a actualizar
     * @param tx - Cliente de base de datos o transacción (opcional)
     * @returns El propietario actualizado
     */
    static async updateByUsuarioId(usuarioId: string, data: Partial<NewPropietario>, tx?: DBClient): Promise<Propietario | null> {
        const client = tx || db;
        const [updated] = await client.update(propietarios)
            .set(data)
            .where(eq(propietarios.usuario_id, usuarioId))
            .returning();
        return updated || null;
    }

    /**
     * Elimina (marca como inactivo) un propietario.
     * @param usuarioId - ID del usuario del propietario
     * @param tx - Cliente de base de datos o transacción (opcional)
     */
    static async deleteByUsuarioId(usuarioId: string, tx?: DBClient): Promise<void> {
        const client = tx || db;
        await client.update(propietarios)
            .set({ es_activo: false })
            .where(eq(propietarios.usuario_id, usuarioId));
    }
}
