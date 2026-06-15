export interface Mascota {
  id: string;
  nombre: string;
  fecha_nacimiento: string;
  sexo: string;
  es_castrado: boolean;
  numero_microchip?: string;
  raza: string;
  especie: string;
  edad?: number;
}

export interface MascotasResponse {
  mascotas: Mascota[];
}

export interface Especie {
  id: number;
  especie: string;
  razas: { id: number; raza: string }[];
}

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

export interface CitaMapped {
  id: string;
  mascota: string;
  mascotaId: string;
  veterinario: string;
  clinica: string;
  clinicaId: string;
  motivo: string;
  fecha: Date;
  estado: string;
}

// ── Auth Types ──

export interface TokenPayload {
  id: string;
  vetId?: string;
  proId?: string;
  email: string;
  rol: string; // 'Veterinario', 'Propietario', 'Admin'
}

export interface RegistroVeterinarioInput {
  usuario: {
    email: string;
    password: string;
  };
  veterinario: {
    nombre: string;
    apellido: string;
    numero_matricula: string;
    telefono: string;
    foto?: string;
  };
  clinica: {
    nombre_comercial: string;
    direccion: string;
    telefono: string;
  };
}

export interface RegistroVeterinarioUnirseInput {
  token: string;
  usuario: RegistroVeterinarioInput['usuario'];
  veterinario: RegistroVeterinarioInput['veterinario'];
}

export interface RegistroPropietarioInput {
  usuario: {
    email: string;
    password: string;
  };
  propietario: {
    nombre: string;
    apellido: string;
    esEmpresa: boolean;
    razonSocial?: string;
    telefono: string;
    foto?: string;
    direccion?: string;
  };
}

export interface UpdateUsuarioInput {
  email?: string;
  password?: string;
}

// ── Proprietor Types ──

export interface PropietarioBase {
  id: string;
  nombre: string;
  apellido: string;
  es_empresa: boolean;
  razon_social: string | null;
  telefono: string;
  direccion: string | null;
  email: string;
}

export interface PropietarioList extends PropietarioBase {
  cantidad_mascotas: number;
}

export interface PropietarioPerfil extends PropietarioBase {
  usuario_id: string;
  foto_url: string | null;
  fecha_creacion: Date | string;
  mascotas: MascotaResumen[];
}

export interface PropietarioResumen {
  id: string;
  nombre: string;
  apellido: string;
  es_empresa: boolean;
  razon_social: string | null;
  telefono: string;
  direccion: string | null;
  activo: boolean;
  relacion: string;
}

// ── Veterinarian Types ──

export interface VeterinarioBase {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string;
}

export interface VeterinarioList extends VeterinarioBase {}

export interface VeterinarioPerfil extends VeterinarioBase {
  numero_matricula: string;
  foto_url: string | null;
  fecha_creacion: Date | string;
  clinicas: ClinicaResumen[];
}

export interface VeterinarioResumen {
  id: string;
  nombre: string;
  apellido: string;
}

export interface ClinicaResumen {
  id: string;
  nombre_comercial: string;
}

// ── Pet/Mascota Types ──

export interface MascotaBase {
  id: string;
  nombre: string;
  sexo: string;
  fecha_nacimiento: Date | string;
  foto_url?: string | null;
  es_castrado: boolean;
  numero_microchip?: string | null;
  alergias?: string | null;
  condiciones_cronicas?: string | null;
  contraindicaciones?: string | null;
  raza: string;
  especie: string;
  edad: number;
}

export interface MascotaList extends MascotaBase {}

export interface MascotaPerfil extends MascotaBase {
  propietarios: PropietarioResumen[];
}

export interface MascotaResumen {
  id: string;
  nombre: string;
  sexo: string;
  edad: number;
  especie: string;
  raza: string;
}

export interface CreateMascotaInput {
  mascota: {
    nombre: string;
    fecha_nacimiento: string;
    sexo: string;
    raza_id: number;
    es_castrado: boolean;
    numero_microchip?: string;
  };
  propietario: {
    propietario_id: string;
    tipo_relacion_id: number;
  };
}

export interface UserData {
  id: string;
  email: string;
  rol: string;
  vetId?: string;
  proId?: string;
  nombre?: string;
  apellido?: string;
  foto_url?: string;
  clinicas?: { id: string; nombre_comercial: string }[];
}

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

export interface HorarioLaboral {
  id?: string;
  veterinario_id?: string;
  clinica_id?: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
}



