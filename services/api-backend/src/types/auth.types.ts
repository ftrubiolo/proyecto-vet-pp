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
    }
    veterinario: {
        nombre: string;
        apellido: string;
        numero_matricula: string;
        telefono: string;
        foto?: string;
    }
    clinica: {
        nombre_comercial: string;
        direccion: string;
        telefono: string;
    }
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
    }
    propietario: {
        nombre: string;
        apellido: string;
        esEmpresa: boolean;
        razonSocial?: string;
        telefono: string;
        foto?: string;
        direccion?: string;
    }
}

export interface UpdateUsuarioInput {
    email?: string;
    password?: string;
}