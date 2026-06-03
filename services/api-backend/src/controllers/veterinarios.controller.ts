import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { veterinarios } from '../db/schema';

export const obtenerPerfil = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        // 1. Capturamos el ID de la URL (ej: /api/veterinarios/9)
        const { id } = request.params as { id: string };
        const vetId = parseInt(id, 10);

        if (isNaN(vetId)) {
            reply.code(400).send({ error: 'El ID proporcionado no es válido.' });
            return;
        }

        // 2. Opcional pero recomendado: Seguridad de acceso
        // Si el usuario logueado es un veterinario, verificamos que solo pueda ver su propio perfil
        // (A menos que sea un Admin o un Propietario buscando un veterinario)
        if (request.user?.rol === 'Veterinario' && request.user.vetId !== vetId) {
            reply.code(403).send({ error: 'No tienes permiso para acceder a este perfil.' });
            return;
        }

        // 3. Consultamos la base de datos aprovechando las relaciones
        const vetData = await db.query.veterinarios.findFirst({
            where: eq(veterinarios.id, vetId),
            with: {
                clinica: true,
                usuario: {
                    columns: {
                        email: true,
                        createdAt: true,
                    },
                    with: {
                        rol: {
                            columns: {
                                nombre: true,
                            }
                        }
                    }
                }
            }
        });

        // 4. Verificamos si existe
        if (!vetData) {
            reply.code(404).send({ error: 'Veterinario no encontrado.' });
            return;
        }

        // 5. Devolvemos la data limpia al frontend mapping to original PascalCase format
        const responseData = {
            id: vetData.id,
            usuarioId: vetData.usuarioId,
            clinicaId: vetData.clinicaId,
            nombre: vetData.nombre,
            apellido: vetData.apellido,
            numeroMatricula: vetData.numeroMatricula,
            telefono: vetData.telefono,
            fotoUrl: vetData.fotoUrl,
            Clinica: vetData.clinica,
            Usuario: vetData.usuario ? {
                email: vetData.usuario.email,
                createdAt: vetData.usuario.createdAt,
                Rol: vetData.usuario.rol ? { nombre: vetData.usuario.rol.nombre } : null
            } : null
        };

        reply.code(200).send(responseData);

    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Ocurrió un error al consultar la base de datos.' });
    }
};