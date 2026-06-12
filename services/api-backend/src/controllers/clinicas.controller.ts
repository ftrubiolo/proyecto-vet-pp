import { FastifyRequest, FastifyReply } from 'fastify';
import { ClinicaService } from '../services/clinica.service';
import { db } from '../db';
import { and, eq } from 'drizzle-orm';
import { clinicas, clinicas_mascotas, mascotas } from '../db/schema';
import { VetService } from '../services/veterinario.service';
import { Validation } from '../utils/validation';

export async function getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
        const clinicas = await ClinicaService.getAll();
        return reply.code(200).send(clinicas);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export async function getOne(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    try {
        const clinica = await ClinicaService.getById(id);
        if (!clinica) return reply.code(404).send({ message: 'Clínica no encontrada' });
        return reply.code(200).send(clinica);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export async function create(request: FastifyRequest, reply: FastifyReply) {
    const data = request.body as any;
    try {
        const clinica = await ClinicaService.create(data);
        return reply.code(201).send(clinica);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export async function update(request: FastifyRequest, reply: FastifyReply) {
    // Basic placeholder for update clinic
    return reply.code(501).send({ message: 'No implementado' });
}

export async function admision(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user) return reply.code(401).send({ message: 'No autorizado' });

    const { id: clinicaId } = request.params as { id: string };
    const { mascotaId } = request.body as { mascotaId: string };

    if (!mascotaId) {
        return reply.code(400).send({ message: 'El ID de la mascota es requerido' });
    }

    // Si no es Admin, verificar que el veterinario pertenezca a la clínica
    if (user.rol !== 'Admin') {
        if (!user.vetId) {
            return reply.code(403).send({ message: 'No tienes un perfil de veterinario asociado' });
        }
        const association = await VetService.getAssociationWithClinica(user.vetId, clinicaId);
        if (!association) {
            return reply.code(403).send({ message: 'No perteneces a esta clínica' });
        }
    }

    try {
        // Verificar que la mascota existe
        const petExists = await db.query.mascotas.findFirst({
            where: eq(mascotas.id, mascotaId),
            columns: { id: true, nombre: true }
        });
        if (!petExists) {
            return reply.code(404).send({ message: 'La mascota especificada no existe' });
        }

        // Verificar si ya está asociada
        const existing = await db.query.clinicas_mascotas.findFirst({
            where: and(
                eq(clinicas_mascotas.clinica_id, clinicaId),
                eq(clinicas_mascotas.mascota_id, mascotaId)
            )
        });

        if (existing) {
            await db.update(clinicas_mascotas)
                .set({
                    estado_paciente_id: 2, // Activo
                    fecha_admision: new Date(),
                    fecha_egreso: null
                })
                .where(and(
                    eq(clinicas_mascotas.clinica_id, clinicaId),
                    eq(clinicas_mascotas.mascota_id, mascotaId)
                ));
        } else {
            await db.insert(clinicas_mascotas).values({
                clinica_id: clinicaId,
                mascota_id: mascotaId,
                estado_paciente_id: 2, // Activo
                fecha_admision: new Date()
            });
        }

        return reply.code(200).send({
            message: `Mascota '${petExists.nombre}' admitida exitosamente como paciente`
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
}

export const getByMascota = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { mascotaId } = request.params as { mascotaId: string };
    if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

    try {
        const hasAccess = await Validation.hasAccesMascota(request.user, mascotaId);
        if (!hasAccess) {
            return reply.code(403).send({ message: 'No tienes acceso a esta mascota' });
        }

        const results = await db
            .select({
                id: clinicas.id,
                nombre_comercial: clinicas.nombre_comercial,
                direccion: clinicas.direccion,
                telefono: clinicas.telefono
            })
            .from(clinicas_mascotas)
            .innerJoin(clinicas, eq(clinicas_mascotas.clinica_id, clinicas.id))
            .where(
                and(
                    eq(clinicas_mascotas.mascota_id, mascotaId),
                    eq(clinicas_mascotas.estado_paciente_id, 2) // Activo
                )
            );
        return reply.code(200).send(results);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        return reply.code(500).send({ message });
    }
};