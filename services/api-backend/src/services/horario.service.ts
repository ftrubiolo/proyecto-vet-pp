import { db } from "../db";
import { and, eq, gte, lte, notInArray } from "drizzle-orm";
import { horarios_laborales, citas } from "../db/schema";
import type { NewHorarioLaboral, HorarioLaboralDb } from "../types/db.types";

export class HorarioService {
    /**
     * Obtiene todos los horarios laborales de un veterinario.
     */
    static async getByVeterinarioId(vetId: string): Promise<HorarioLaboralDb[]> {
        return await db.query.horarios_laborales.findMany({
            where: eq(horarios_laborales.veterinario_id, vetId),
            orderBy: (hl, { asc }) => [asc(hl.dia_semana), asc(hl.hora_inicio)],
        });
    }

    /**
     * Obtiene los horarios de un veterinario para una clínica específica.
     */
    static async getByVetAndClinica(vetId: string, clinicaId: string): Promise<HorarioLaboralDb[]> {
        return await db.query.horarios_laborales.findMany({
            where: and(
                eq(horarios_laborales.veterinario_id, vetId),
                eq(horarios_laborales.clinica_id, clinicaId)
            ),
            orderBy: (hl, { asc }) => [asc(hl.dia_semana), asc(hl.hora_inicio)],
        });
    }

    /**
     * Sobrescribe los horarios de un veterinario para una clínica específica.
     */
    static async updateClinicaHorarios(vetId: string, clinicaId: string, horarios: Omit<NewHorarioLaboral, 'id' | 'veterinario_id' | 'clinica_id'>[]): Promise<HorarioLaboralDb[]> {
        return await db.transaction(async (tx) => {
            // 1. Eliminar horarios existentes para esa clínica y veterinario
            await tx.delete(horarios_laborales)
                .where(and(
                    eq(horarios_laborales.veterinario_id, vetId),
                    eq(horarios_laborales.clinica_id, clinicaId)
                ));

            // 2. Insertar los nuevos horarios si hay alguno
            if (horarios.length > 0) {
                const valuesToInsert = horarios.map(h => ({
                    veterinario_id: vetId,
                    clinica_id: clinicaId,
                    dia_semana: h.dia_semana,
                    hora_inicio: h.hora_inicio,
                    hora_fin: h.hora_fin
                }));
                return await tx.insert(horarios_laborales).values(valuesToInsert).returning();
            }

            return [];
        });
    }

    /**
     * Calcula los slots de tiempo disponibles para citas.
     * @param clinicaId ID de la clínica
     * @param veterinarioId ID del veterinario
     * @param fechaStr Cadena de la fecha (YYYY-MM-DD)
     * @returns Array de strings con las horas disponibles ("HH:MM")
     */
    static async calcularDisponibilidad(clinicaId: string, veterinarioId: string, fechaStr: string): Promise<string[]> {
        const fecha = new Date(`${fechaStr}T12:00:00`); // Evitar desvíos de zona horaria usando el mediodía como referencia
        const diaSemana = fecha.getDay(); // 0 = Domingo, 1 = Lunes, etc.

        // 1. Consultar la agenda laboral del veterinario en ese día de la semana
        const rangosLaborales = await db.query.horarios_laborales.findMany({
            where: and(
                eq(horarios_laborales.veterinario_id, veterinarioId),
                eq(horarios_laborales.clinica_id, clinicaId),
                eq(horarios_laborales.dia_semana, diaSemana)
            )
        });

        if (rangosLaborales.length === 0) {
            return [];
        }

        // 2. Generar todos los slots posibles de 30 minutos
        const slotsPosibles: string[] = [];
        for (const rango of rangosLaborales) {
            const [startH, startM] = rango.hora_inicio.split(':').map(Number);
            const [endH, endM] = rango.hora_fin.split(':').map(Number);

            let currentMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;

            while (currentMinutes + 30 <= endMinutes) {
                const h = Math.floor(currentMinutes / 60);
                const m = currentMinutes % 60;
                const hh = h.toString().padStart(2, '0');
                const mm = m.toString().padStart(2, '0');
                slotsPosibles.push(`${hh}:${mm}`);
                currentMinutes += 30; // intervalo de 30 minutos
            }
        }

        // 3. Consultar citas agendadas para el veterinario en esa fecha específica
        // Definir inicio y fin de día local
        const startOfDay = new Date(fechaStr + "T00:00:00");
        const endOfDay = new Date(fechaStr + "T23:59:59.999");

        const citasExistentes = await db.query.citas.findMany({
            where: and(
                eq(citas.veterinario_id, veterinarioId),
                eq(citas.clinica_id, clinicaId),
                gte(citas.fecha_hora, startOfDay),
                lte(citas.fecha_hora, endOfDay),
                notInArray(citas.estado_cita_id, [3, 4]) // Excluir Cancelada (3) y No-Show (4)
            )
        });

        // 4. Mapear horas ocupadas
        const horasOcupadas = new Set<string>();
        for (const cita of citasExistentes) {
            const h = cita.fecha_hora.getHours().toString().padStart(2, '0');
            const m = cita.fecha_hora.getMinutes().toString().padStart(2, '0');
            horasOcupadas.add(`${h}:${m}`);
        }

        // 5. Filtrar slots libres
        return slotsPosibles.filter(slot => !horasOcupadas.has(slot));
    }
}
