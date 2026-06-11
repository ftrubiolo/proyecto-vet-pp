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
> & {
    raza: string;
    especie: string;
    edad: number;
}

export type MascotaList = MascotaBase & {

}

export type MascotaPerfil = MascotaBase & {
    fecha_nacimiento: MascotaDb['fecha_nacimiento'];
    foto_url: MascotaDb['foto_url'];
    numero_microchip: MascotaDb['numero_microchip'];
    es_castrado: MascotaDb['es_castrado'];
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