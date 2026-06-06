import { db } from '../db';
import { eq } from 'drizzle-orm';
import { roles } from '../db/schema';


/**
 * Servicio para gestionar la lógica de negocio y consultas de base de datos de los roles.
 */
export class RoleService {
  /**
   * Obtiene el nombre del rol a partir de su ID.
   * @param id - ID del rol
   * @returns Nombre del rol o null si no se encuentra
   */
  static async getNameById(id: number): Promise<string | null> {
    const rolResult = await db.query.roles.findFirst({
      where: eq(roles.id, id),
      columns: { nombre: true },
    });
    return rolResult?.nombre || null;
  }

  /**
   * Obtiene el ID del rol a partir de su nombre.
   * @param name - Nombre del rol
   * @returns ID del rol o null si no se encuentra
   */
  static async getIdByName(name: string): Promise<number | null> {
    const rolResult = await db.query.roles.findFirst({
      where: eq(roles.nombre, name),
      columns: { id: true },
    });
    return rolResult?.id || null;
  }
}
