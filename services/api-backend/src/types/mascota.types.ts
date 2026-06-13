import { MascotaDb, NewMascota } from "./db.types";
import { PropietarioResumen } from "./propietario.types";

export interface CreateMascotaInput {
    mascota: NewMascota;
    propietario: { propietario_id: string; tipo_relacion_id: number }
}

export type MascotaBase = Pick<MascotaDb,
    | 'id'
    | 'nombre'
    | 'sexo'
    | 'fecha_nacimiento'
    | 'foto_url'
    | 'es_castrado'
    | 'numero_microchip'
    | 'alergias'
    | 'condiciones_cronicas'
    | 'contraindicaciones'
> & {
    raza: string;
    especie: string;
    edad: number;
}

export type MascotaList = MascotaBase & {

}

export type MascotaPerfil = MascotaBase & {
    propietarios: PropietarioResumen[];
};

export type MascotaResumen = Pick<MascotaBase,
    | 'id'
    | 'nombre'
    | 'sexo'
    | 'edad'
    | 'especie'
    | 'raza'
>;