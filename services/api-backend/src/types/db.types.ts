import { usuarios, veterinarios, propietarios, clinicas, veterinarios_clinicas, mascotas, mascotas_propietarios, citas, tratamientos, atenciones, atenciones_diagnosticos, vacuna_protocolo, vacuna_serie, vacuna_dosis, horarios_laborales } from "../db/schema";
import { db } from "../db";

export type DBClient = typeof db | any;

export type UsuarioDb = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;

export type VeterinarioDb = typeof veterinarios.$inferSelect;
export type NewVeterinario = typeof veterinarios.$inferInsert;

export type UpdateVeterinario = Partial<Pick<NewVeterinario,
    | 'nombre'
    | 'apellido'
    | 'telefono'
    | 'foto_url'
>>;

export type PropietarioDb = typeof propietarios.$inferSelect;
export type NewPropietario = typeof propietarios.$inferInsert;

export type UpdatePropietario = Partial<Pick<NewPropietario,
    | 'nombre'
    | 'apellido'
    | 'telefono'
    | 'foto_url'
    | 'direccion'
    | 'razon_social'
>>;

export type ClinicaDb = typeof clinicas.$inferSelect;
export type NewClinica = typeof clinicas.$inferInsert;

export type VeterinarioClinicaDb = typeof veterinarios_clinicas.$inferSelect;
export type NewVeterinarioClinica = typeof veterinarios_clinicas.$inferInsert;

export type MascotaDb = typeof mascotas.$inferSelect;
export type NewMascota = typeof mascotas.$inferInsert;


export type UpdateMascota = Partial<Pick<NewMascota,
    | 'nombre'
    | 'sexo'
    | 'fecha_nacimiento'
    | 'raza_id'
    | 'foto_url'
    | 'numero_microchip'
    | 'es_castrado'
    | 'alergias'
    | 'condiciones_cronicas'
    | 'contraindicaciones'
>>;

export type MascotaPropietarioDb = typeof mascotas_propietarios.$inferSelect;
export type NewMascotaPropietario = typeof mascotas_propietarios.$inferInsert;

export type CitaDb = typeof citas.$inferSelect;
export type NewCita = typeof citas.$inferInsert;
export type UpdateCita = Partial<NewCita>;

export type AtencionDb = typeof atenciones.$inferSelect;
export type NewAtencion = typeof atenciones.$inferInsert;

export type TratamientoDb = typeof tratamientos.$inferSelect;
export type NewTratamiento = typeof tratamientos.$inferInsert;
export type UpdateTratamiento = Partial<NewTratamiento>;

export type VacunaProtocoloDb = typeof vacuna_protocolo.$inferSelect;
export type NewVacunaProtocolo = typeof vacuna_protocolo.$inferInsert;
export type UpdateVacunaProtocolo = Partial<NewVacunaProtocolo>;

export type VacunaSerieDb = typeof vacuna_serie.$inferSelect;
export type NewVacunaSerie = typeof vacuna_serie.$inferInsert;
export type UpdateVacunaSerie = Partial<NewVacunaSerie>;

export type VacunaDosisDb = typeof vacuna_dosis.$inferSelect;
export type NewVacunaDosis = typeof vacuna_dosis.$inferInsert;
export type UpdateVacunaDosis = Partial<NewVacunaDosis>;

export type HorarioLaboralDb = typeof horarios_laborales.$inferSelect;
export type NewHorarioLaboral = typeof horarios_laborales.$inferInsert;
export type UpdateHorarioLaboral = Partial<NewHorarioLaboral>;