import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, roles } from '../db/schema';
import bcrypt from 'bcrypt';
import { RolService } from './rol.service';

import type { UsuarioDb, NewUsuario, DBClient } from '../types/db.types';
import type { UpdateUsuarioInput } from '@vetvault/shared';

export type UsuarioAuth = Pick<UsuarioDb, 'id' | 'email' | 'password_hash'> & { rol: string };

export interface Usuario {
  id: string;
  email: string;
  rol: string;
  fecha_creacion: Date;
}

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

    const rolRecord = await client.query.roles.findFirst({
      where: eq(roles.id, newUser.rol_id),
    });

    return {
      id: newUser.id,
      email: newUser.email,
      rol: rolRecord ? rolRecord.rol : '',
      fecha_creacion: newUser.fecha_creacion,
    };
  }

  /**
   * Actualiza un usuario.
   * @param id - ID del usuario a actualizar
   * @param data - Datos del usuario a actualizar
   * @param tx - Cliente de base de datos o transacción (opcional)
   * @returns El usuario actualizado
   */
  static async update(id: string, data: UpdateUsuarioInput, tx?: DBClient): Promise<Usuario | null> {
    const client = tx || db;

    const updateData: { email?: string; password_hash?: string } = {};
    if (data.email) updateData.email = data.email;
    if (data.password) updateData.password_hash = await bcrypt.hash(data.password, 10);

    const [updatedUser] = await client.update(usuarios)
      .set(updateData)
      .where(eq(usuarios.id, id))
      .returning();
    if (!updatedUser) return null;

    const rolRecord = await RolService.getById(updatedUser.rol_id);
    if (!rolRecord) throw new Error('Rol no encontrado');

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      rol: rolRecord,
      fecha_creacion: updatedUser.fecha_creacion,
    };
  }

  /**
   * Obtiene un usuario por su email.
   * @param email - Email del usuario
   * @returns Usuario encontrado o null si no existe
   */
  static async getByEmail(email: string): Promise<Usuario | null> {
    const user = await db.query.usuarios.findFirst({
      columns: {
        id: true,
        email: true,
        fecha_creacion: true,
      },
      with: {
        rol: {
          columns: {
            rol: true,
          },
        },
      },
      where: eq(usuarios.email, email),
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      rol: user.rol.rol,
      fecha_creacion: user.fecha_creacion,
    };
  }

  /**
   * Obtiene las credenciales de autenticación de un usuario por su email.
   * @param email - Email del usuario
   * @returns Credenciales del usuario o null si no existe
   */
  static async getAuthCredentialsByEmail(email: string): Promise<UsuarioAuth | null> {
    const user = await db.query.usuarios.findFirst({
      columns: {
        id: true,
        email: true,
        password_hash: true,
      },
      with: {
        rol: {
          columns: {
            rol: true,
          },
        },
      },
      where: eq(usuarios.email, email),
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      rol: user.rol.rol,
    };
  }

  /**
   * Obtiene un usuario por su ID.
   * @param id - ID del usuario
   * @returns Usuario encontrado o null si no existe
   */
  static async getById(id: string): Promise<Usuario | null> {
    const user = await db.query.usuarios.findFirst({
      columns: {
        id: true,
        email: true,
        fecha_creacion: true,
      },
      with: {
        rol: {
          columns: {
            rol: true,
          },
        },
      },
      where: eq(usuarios.id, id),
    });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      rol: user.rol.rol,
      fecha_creacion: user.fecha_creacion,
    };
  }

  /**
   * Obtiene todos los usuarios.
   * @returns Lista de usuarios
   */
  static async getAll(): Promise<Usuario[]> {
    const users = await db.query.usuarios.findMany({
      columns: {
        id: true,
        email: true,
        fecha_creacion: true,
      },
      with: {
        rol: {
          columns: {
            rol: true,
          },
        },
      },
    });
    return users.map((user) => ({
      id: user.id,
      email: user.email,
      rol: user.rol.rol,
      fecha_creacion: user.fecha_creacion,
    }));
  };
}

