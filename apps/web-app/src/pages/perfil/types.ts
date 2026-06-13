export interface VetProfile {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  numero_matricula: string;
  foto_url?: string;
  usuario?: {
    email: string;
  };
  clinicas?: {
    id: string;
    nombre_comercial: string;
    direccion?: string;
    telefono?: string;
  }[];
}

export interface OwnerProfile {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion?: string;
  es_empresa: boolean;
  razon_social?: string;
  foto_url?: string;
  usuario?: {
    email: string;
  };
}
