import { TokenPayload } from '../middlewares/auth.middleware';
import { UserService } from '../services/user.service';
import { VetService } from '../services/vet.service';


/**
 * Clase de utilidad para validaciones de negocio (existencia de emails, licencias oficiales) 
 * y comprobaciones de autorización (dueño del recurso, administrador).
 */
export class Validation {
  // ==========================================
  // 1. Validaciones de Base de Datos
  // ==========================================

  /**
   * Verifica si existe un usuario con el email proporcionado (delegado a UserService).
   * @param email - Email a verificar
   * @returns true si el email existe, false en caso contrario
   */
  static async existingUser(email: string): Promise<boolean> {
    return UserService.existsByEmail(email);
  }

  /**
   * Verifica si una matrícula es válida (delegado a VetService).
   * @param matricula - Número de matrícula a verificar
   * @returns true si la matrícula es válida, false en caso contrario
   */
  static async isValidMatricula(matricula: string): Promise<boolean> {
    return VetService.isValidMatricula(matricula);
  }


  // ==========================================
  // 2. Validaciones de Autorización / Permisos
  // ==========================================

  /**
   * Comprueba si el usuario autenticado tiene rol de Administrador.
   * @param user - Usuario autenticado
   * @returns true si el usuario es administrador, false en caso contrario
   */
  static isAdmin(user?: TokenPayload): boolean {
    return user?.rol === 'Admin';
  }

  /**
   * Comprueba si el usuario autenticado es dueño del recurso.
   * @param user - Usuario autenticado
   * @param resourceOwnerId - ID del dueño del recurso
   * @returns true si el usuario es dueño del recurso, false en caso contrario
   */
  static isSelf(user?: TokenPayload, resourceOwnerId?: string): boolean {
    return !!user && String(user.id) === resourceOwnerId;
  }

  /**
   * Comprueba si el usuario tiene permiso para operar en el recurso
   * (es Administrador o es el dueño del recurso).
   * @param user - Usuario autenticado
   * @param resourceOwnerId - ID del dueño del recurso
   * @returns true si el usuario tiene permiso para operar en el recurso, false en caso contrario
   */
  static hasAccess(user?: TokenPayload, resourceOwnerId?: string): boolean {
    return this.isAdmin(user) || this.isSelf(user, resourceOwnerId);
  }
}
