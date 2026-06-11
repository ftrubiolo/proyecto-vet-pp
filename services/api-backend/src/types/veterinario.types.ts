import { ClinicaDb, UsuarioDb, VeterinarioDb } from "./db.types";

export type VeterinarioBase = Pick<VeterinarioDb,
    | 'id'
    | 'nombre'
    | 'apellido'
    | 'telefono'
> & {
    email: UsuarioDb['email'];
}

export type VeterinarioList = VeterinarioBase & {
}

export type VeterinarioPerfil = VeterinarioBase & {
    numero_matricula: VeterinarioDb['numero_matricula'];
    foto_url: VeterinarioDb['foto_url'];
    telefono: VeterinarioDb['telefono'];
    fecha_creacion: UsuarioDb['fecha_creacion'];
    clinicas: ClinicaResumen[];
}

export type VeterinarioResumen = Pick<VeterinarioBase,
    | 'id'
    | 'nombre'
    | 'apellido'
>;

export type ClinicaResumen = Pick<ClinicaDb,
    | 'id'
    | 'nombre_comercial'
>;