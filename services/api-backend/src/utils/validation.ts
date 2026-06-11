import { TokenPayload } from '../types/auth.types';
import { UserService } from '../services/user.service';
import { VetService } from '../services/veterinario.service';
import { MascotaService } from '../services/mascota.service';
import { ClinicaService } from '../services/clinica.service';


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

  /**
   * Verifica si un usuario es dueño de una mascota.
   * @param user - Usuario autenticado
   * @param mascotaId - ID de la mascota
   * @returns true si el usuario es dueño de la mascota, false en caso contrario
   */
  static async isOwner(user: TokenPayload, mascotaId: string): Promise<boolean> {
    if (!user.proId) return false;
    return await MascotaService.isOwner(user.proId, mascotaId);
  }

  /**
   * Verifica si un veterinario atiende a una mascota.
   * @param user - Usuario autenticado
   * @param mascotaId - ID de la mascota
   * @returns true si el veterinario atiende a la mascota, false en caso contrario
   */
  static async isPaciente(user: TokenPayload, mascotaId: string): Promise<boolean> {
    if (!user.vetId) return false;
    return await VetService.isPaciente(user.vetId, mascotaId);
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
   * Comprueba si el usuario autenticado es el propietario del recurso (compara con su proId).
   * o si es Administrador.
   * @param user - Usuario autenticado
   * @param propietarioId - ID del propietario
   * @returns true si es administrador o el propietario en sí, false en caso contrario
   */
  static isSelfPropietario(user?: TokenPayload, propietarioId?: string): boolean {
    return this.isAdmin(user) || (!!user && user.proId === propietarioId);
  }

  /**
   * Comprueba si el usuario autenticado es el veterinario del recurso (compara con su vetId).
   * o si es Administrador.
   * @param user - Usuario autenticado
   * @param veterinarioId - ID del veterinario
   * @returns true si es administrador o el veterinario en sí, false en caso contrario
   */
  static isSelfVeterinario(user?: TokenPayload, veterinarioId?: string): boolean {
    return this.isAdmin(user) || (!!user && user.vetId === veterinarioId);
  }

  static async hasAccesMascota(user: TokenPayload, mascotaId: string): Promise<boolean> {
    return this.isAdmin(user) || await this.isOwner(user, mascotaId) || await this.isPaciente(user, mascotaId);
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
