import { db } from '../db';
import { eq } from 'drizzle-orm';
import { roles } from '../db/schema';

export class RoleService {
  /**
   * Obtiene el nombre del rol a partir de su ID.
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
   */
  static async getIdByName(name: string): Promise<number | null> {
    const rolResult = await db.query.roles.findFirst({
      where: eq(roles.nombre, name),
      columns: { id: true },
    });
    return rolResult?.id || null;
  }
}
