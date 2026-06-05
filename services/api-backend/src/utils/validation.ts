import { TokenPayload } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';

export class Validation {
  // ==========================================
  // 1. Validaciones de Base de Datos
  // ==========================================
  
  /**
   * Verifica si un email ya está registrado en la base de datos (delegado a UserService).
   */
  static async existingUser(email: string): Promise<boolean> {
    return UserService.existsByEmail(email);
  }

  // ==========================================
  // 2. Validaciones de Autorización / Permisos
  // ==========================================

  /**
   * Comprueba si el usuario tiene rol de Administrador.
   */
  static isAdmin(user?: TokenPayload): boolean {
    return user?.rol === 'Admin';
  }

  /**
   * Comprueba si el usuario autenticado es dueño del recurso.
   */
  static isSelf(user?: TokenPayload, resourceOwnerId?: string): boolean {
    return !!user && String(user.id) === resourceOwnerId;
  }

  /**
   * Comprueba si el usuario tiene permiso para operar en el recurso
   * (es Administrador o es el dueño del recurso).
   */
  static hasAccess(user?: TokenPayload, resourceOwnerId?: string): boolean {
    return this.isAdmin(user) || this.isSelf(user, resourceOwnerId);
  }
}
