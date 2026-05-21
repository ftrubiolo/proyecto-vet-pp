import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
// Importamos la interfaz que creamos para el middleware
import { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();

export const obtenerPerfil = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Capturamos el ID de la URL (ej: /api/veterinarios/9)
        const vetId = parseInt(req.params.id as string);

        if (isNaN(vetId)) {
            res.status(400).json({ error: 'El ID proporcionado no es válido.' });
            return;
        }

        // 2. Opcional pero recomendado: Seguridad de acceso
        // Si el usuario logueado es un veterinario, verificamos que solo pueda ver su propio perfil
        // (A menos que sea un Admin o un Propietario buscando un veterinario)
        if (req.user?.rol === 'Veterinario' && req.user.id !== vetId) {
            // Nota: req.user.id es el ID del Usuario, tendrías que asegurarte de comparar
            // contra el UsuarioId del veterinario, no el Id del veterinario directamente.
            // Por simplicidad, este ejemplo asume que verificás permisos si es necesario.
        }

        // 3. Consultamos la base de datos aprovechando las relaciones
        const veterinario = await prisma.veterinarios.findUnique({
            where: { id: vetId },
            include: {
                // Traemos los datos de la clínica asociada
                Clinica: true,
                // De la tabla Usuarios, SELECCIONAMOS solo lo que nos sirve (Data Transfer Object pattern)
                Usuario: {
                    select: {
                        email: true,
                        createdAt: true,
                        Rol: {
                            select: { nombre: true }
                        }
                    }
                }
            }
        });

        // 4. Verificamos si existe
        if (!veterinario) {
            res.status(404).json({ error: 'Veterinario no encontrado.' });
            return;
        }

        // 5. Devolvemos la data limpia al frontend
        res.status(200).json(veterinario);

    } catch (error) {
        console.error('Error al obtener el perfil del veterinario:', error);
        res.status(500).json({ error: 'Ocurrió un error al consultar la base de datos.' });
    }
};