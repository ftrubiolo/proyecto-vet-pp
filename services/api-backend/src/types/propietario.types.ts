import { TipoRelacionDb } from "../services/catalogo.service";
import { MascotaPropietarioDb, PropietarioDb, UsuarioDb } from "./db.types";
import { MascotaResumen } from "./mascota.types";

export type PropietarioBase = Pick<PropietarioDb,
    | 'id'
    | 'nombre'
    | 'apellido'
    | 'es_empresa'
    | 'razon_social'
    | 'telefono'
    | 'direccion'
> & { email: UsuarioDb['email'] };

export type PropietarioList = PropietarioBase & {
    cantidad_mascotas: number;
}

export type PropietarioPerfil = PropietarioBase & {
    usuario_id: PropietarioDb['usuario_id'];
    foto_url: PropietarioDb['foto_url'];
    fecha_creacion: UsuarioDb['fecha_creacion'];
    mascotas: MascotaResumen[];
}

export type PropietarioResumen = Pick<PropietarioBase,
    | 'id'
    | 'nombre'
    | 'apellido'
    | 'es_empresa'
    | 'razon_social'
    | 'telefono'
    | 'direccion'
> & {
    activo: MascotaPropietarioDb['activo'];
    relacion: TipoRelacionDb['tipo'];
};
