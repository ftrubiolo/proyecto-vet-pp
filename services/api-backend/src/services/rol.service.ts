import { db } from '../db';
import { eq } from 'drizzle-orm';
import { roles } from '../db/schema';

/**
 * Servicio para gestionar la lógica de negocio y consultas de base de datos de los roles.
 */
export class RolService {
  /**
   * Obtiene el rol a partir de su ID.
   * @param id - ID del rol
   * @returns Rol o null si no se encuentra
   */
  static async getById(id: number): Promise<string | null> {
    const rolResult = await db.query.roles.findFirst({
      where: eq(roles.id, id),
      columns: { rol: true },
    });
    return rolResult?.rol || null;
  }

  /**
   * Obtiene el ID del rol a partir de su nombre.
   * @param rol - Nombre del rol
   * @returns ID del rol o null si no se encuentra
   */
  static async getIdByRol(rol: string): Promise<number | null> {
    const rolResult = await db.query.roles.findFirst({
      where: eq(roles.rol, rol),
      columns: { id: true },
    });
    return rolResult?.id || null;
  }
}
