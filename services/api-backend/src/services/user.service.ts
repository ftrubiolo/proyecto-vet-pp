import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios } from '../db/schema';

export type Usuario = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;
type DBClient = typeof db | any;

/**
 * Servicio para gestionar la lógica de negocio, creación y verificación de cuentas de usuario.
 */
export class UserService {
  /**
   * Verifica si un usuario ya existe en la base de datos por su email.
   * @param email - Email a verificar
   * @returns true si el usuario existe, false en caso contrario
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const existingUser = await db.query.usuarios.findFirst({
      where: eq(usuarios.email, email),
      columns: { id: true },
    });
    return !!existingUser;
  }

  /**
   * Crea un nuevo usuario.
   * @param data - Datos del nuevo usuario (insert type)
   * @param tx - Cliente de base de datos o transacción (opcional)
   * @returns El usuario creado
   */
  static async create(data: NewUsuario, tx?: DBClient): Promise<Usuario> {
    const client = tx || db;
    const [newUser] = await client.insert(usuarios).values(data).returning();
    return newUser;
  }
}
