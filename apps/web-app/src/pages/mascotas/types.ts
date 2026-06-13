export interface MascotaDetail {
  id: string;
  nombre: string;
  foto_url?: string;
  fecha_nacimiento: string;
  sexo: string;
  es_castrado: boolean;
  numero_microchip?: string;
  raza: string;
  especie: string;
  alergias?: string;
  condiciones_cronicas?: string;
  contraindicaciones?: string;
  propietarios?: {
    id: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    direccion?: string;
    es_empresa?: boolean;
    razon_social?: string;
    relacion: string;
    activo: boolean;
  }[];
}

export interface Especie {
  id: number;
  especie: string;
  razas: { id: number; raza: string }[];
}
