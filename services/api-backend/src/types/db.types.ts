import { usuarios, veterinarios, propietarios, clinicas, veterinarios_clinicas, mascotas, mascotas_propietarios } from "../db/schema";
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
>>;

export type MascotaPropietarioDb = typeof mascotas_propietarios.$inferSelect;
export type NewMascotaPropietario = typeof mascotas_propietarios.$inferInsert;