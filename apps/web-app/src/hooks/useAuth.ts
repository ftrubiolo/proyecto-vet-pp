import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Hook personalizado para acceder de forma segura al contexto de autenticación.
 * @returns AuthContextType - Objeto con información del usuario y funciones de autenticación.
 * @throws Error si se intenta usar fuera de un AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
