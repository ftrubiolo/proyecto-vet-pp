import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios } from '../db/schema';

export class UserService {
  /**
   * Verifica si un usuario ya existe en la base de datos por su email.
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const existingUser = await db.query.usuarios.findFirst({
      where: eq(usuarios.email, email),
      columns: { id: true },
    });
    return !!existingUser;
  }
}
