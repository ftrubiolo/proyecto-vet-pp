import type { TokenPayload } from "@vetvault/shared";
import { MascotaService } from "../mascota.service";
import { AtencionService } from "../atencion.service";
import { CitaService } from "../cita.service";
import { VetService } from "../veterinario.service";
import { ClinicaService } from "../clinica.service";

export async function buildClinicalContext(mascotaId: string): Promise<string> {
    const pet = await MascotaService.getById(mascotaId);
    const historyList = await AtencionService.getByMascotaId(mascotaId);

    return `
INFORMACIÓN DEL PACIENTE ACTIVO:
Nombre: ${pet?.nombre}
Especie: ${pet?.especie}
Raza: ${pet?.raza}
Edad: ${pet?.edad} años (Fecha nac: ${pet?.fecha_nacimiento})
Sexo: ${pet?.sexo === "M" ? "Macho" : "Hembra"}
Castrado: ${pet?.es_castrado ? "Sí" : "No"}
Microchip: ${pet?.numero_microchip || "N/A"}
Alergias: ${pet?.alergias || "Ninguna registrada"}
Condiciones Crónicas: ${pet?.condiciones_cronicas || "Ninguna registrada"}
Contraindicaciones: ${pet?.contraindicaciones || "Ninguna registrada"}

HISTORIAL DE CONSULTAS Y ATENCIONES:
${JSON.stringify(historyList?.map((h: any) => ({
    fecha: h.fecha_atencion,
    veterinario: `${h.veterinario?.nombre} ${h.veterinario?.apellido}`,
    clinica: h.clinica?.nombre_comercial,
    peso: h.peso_actual,
    notas: h.notas_clinicas,
    diagnosticos: h.atenciones_diagnosticos?.map((d: any) => d.diagnostico?.diagnostico),
    tratamientos: h.tratamientos?.map((t: any) => ({
        tipo: t.tipo_tratamiento?.tipo,
        medicamento: t.producto?.nombre_comercial,
        dosis: t.dosis,
        frecuencia: t.frecuencia,
        indicaciones: t.indicaciones_adicionales
    }))
})))}
    `;
}

export async function buildGeneralContext(user: TokenPayload): Promise<string> {
    let petsList: any[] = [];

    if (user.rol === "Admin") {
        petsList = (await MascotaService.getAll()) || [];
    } else if (user.rol === "Veterinario") {
        if (user.vetId) {
            petsList = (await MascotaService.getAllMascotasByVeterinarioId(user.vetId)) || [];
        }
    } else if (user.rol === "Propietario") {
        if (user.proId) {
            petsList = (await MascotaService.getAllMascotasByPropietarioId(user.proId)) || [];
        }
    }

    let upcomingContext = "";
    let clinicasContext = "";

    if (user.rol === "Veterinario" && user.vetId) {
        const now = new Date();
        const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endWeek = new Date(startToday);
        endWeek.setDate(endWeek.getDate() + 7);

        const citas = (await CitaService.getByVeterinarioId(user.vetId, {
            start: startToday,
            end: endWeek
        })) || [];

        const pending = citas
            .filter((c: any) => c.estado_cita_id === 1 || c.estado_cita_id === 2)
            .slice(0, 5);

        if (pending.length > 0) {
            upcomingContext = `
PRÓXIMAS CITAS (próximos 7 días):
${JSON.stringify(pending.map((c: any) => ({
    paciente: c.mascota?.nombre,
    fecha: c.fecha_hora,
    motivo: c.motivo_cita?.motivo,
    estado: c.estado_cita?.estado,
    clinica: c.clinica?.nombre_comercial
})))}
`;
        }

        const vetClinicas = await VetService.getClinicasByVeterinarioId(user.vetId);
        if (vetClinicas && vetClinicas.length > 0) {
            const clinicasData = await Promise.all(
                vetClinicas.map(id => ClinicaService.getById(id))
            );
            clinicasContext = `
TUS CLÍNICAS:
${JSON.stringify(clinicasData.filter(Boolean).map(c => ({
    id: c!.id,
    nombre: c!.nombre_comercial
})))}
`;
        }
    }

    return `
MASCOTAS A LAS QUE TIENES ACCESO:
${JSON.stringify(petsList.map((p: any) => ({
    id: p.id,
    nombre: p.nombre,
    especie: p.especie,
    raza: p.raza,
    edad: p.edad
})))}
${upcomingContext}${clinicasContext}
    `;
}
