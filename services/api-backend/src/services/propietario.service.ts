import { db } from "../db";
import { eq } from "drizzle-orm";
import { mascotas_propietarios, propietarios } from "../db/schema";
import { MascotaResumen, MascotaService } from "./mascota.service";

import type { PropietarioDb, NewPropietario, DBClient } from '../types/db.types';

export interface Propietario {
    id: string;
    usuario_id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
    es_empresa: boolean;
    razon_social?: string | null;
    direccion?: string | null;
    cantidad_mascotas: number;
}

export interface PerfilPropietario {
    id: string;
    usuario_id: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string | null;
    es_empresa: boolean;
    razon_social?: string | null;
    foto_url?: string | null;
    direccion?: string | null;
    fecha_creacion: Date;
    mascotas: MascotaResumen[];
}

/**
 * Servicio para la gestión de propietarios.
 */
export class PropietarioService {
    /**
     * Obtiene todos los propietarios.
     * @returns Array de propietarios -> {@link Propietario}
     */
    static async getAll(): Promise<Propietario[]> {
        const result = await db.query.propietarios.findMany({
            with: {
                usuario: {
                    columns: {
                        email: true,
                    }
                },
                mascotas_propietarios: {
                    columns: {
                        mascota_id: true,
                    },
                    where: eq(mascotas_propietarios.activo, true),
                }
            }
        });
        if (!result) return [];
        return result.map((p) => ({
            id: p.id,
            usuario_id: p.usuario_id,
            nombre: p.nombre,
            apellido: p.apellido,
            email: p.usuario.email,
            telefono: p.telefono,
            es_empresa: p.es_empresa,
            razon_social: p.razon_social,
            direccion: p.direccion,
            cantidad_mascotas: p.mascotas_propietarios.length,
        }));
    }

    /**
     * Obtiene un propietario por ID.
     * @param id - ID del propietario
     * @returns Propietario encontrado -> {@link Propietario} o null si no existe
     */
    static async getById(id: string): Promise<PerfilPropietario | null> {
        const result = await db.query.propietarios.findFirst({
            where: eq(propietarios.id, id),
            with: {
                usuario: {
                    columns: {
                        email: true,
                        fecha_creacion: true,
                    }
                },
                mascotas_propietarios: {
                    where: eq(mascotas_propietarios.activo, true),
                    with: {
                        mascota: {
                            with: {
                                raza: {
                                    with: {
                                        especie: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
        if (!result) return null;
        return {
            id: result.id,
            usuario_id: result.usuario_id,
            nombre: result.nombre,
            apellido: result.apellido,
            email: result.usuario.email,
            telefono: result.telefono,
            es_empresa: result.es_empresa,
            razon_social: result.razon_social,
            foto_url: result.foto_url,
            direccion: result.direccion,
            fecha_creacion: result.usuario.fecha_creacion,
            mascotas: result.mascotas_propietarios.flatMap((mp) => {
                const m = mp.mascota;
                if (!m) return [];
                return [{
                    id: m.id,
                    nombre: m.nombre,
                    foto_url: m.foto_url,
                    edad: MascotaService.calcularEdad(m.fecha_nacimiento),
                    sexo: m.sexo as 'M' | 'H',
                    especie: m.raza.especie.especie,
                    raza: m.raza.raza,
                    esterilizado: m.es_castrado,
                    activo: mp.activo,
                }];
            }),
        };
    }

    /**
     * Obtiene un propietario por ID de usuario.
     * @param usuarioId - ID del usuario
     * @returns Propietario encontrado -> {@link Propietario} o null si no existe
     */
    static async getByUsuarioId(usuarioId: string): Promise<PerfilPropietario | null> {
        const result = await db.query.propietarios.findFirst({
            where: eq(propietarios.usuario_id, usuarioId),
            with: {
                usuario: {
                    columns: {
                        email: true,
                        fecha_creacion: true,
                    }
                },
                mascotas_propietarios: {
                    where: eq(mascotas_propietarios.activo, true),
                    with: {
                        mascota: {
                            with: {
                                raza: {
                                    with: {
                                        especie: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
        });
        if (!result) return null;
        return {
            id: result.id,
            usuario_id: result.usuario_id,
            nombre: result.nombre,
            apellido: result.apellido,
            email: result.usuario.email,
            telefono: result.telefono,
            es_empresa: result.es_empresa,
            razon_social: result.razon_social,
            foto_url: result.foto_url,
            direccion: result.direccion,
            fecha_creacion: result.usuario.fecha_creacion,
            mascotas: result.mascotas_propietarios.flatMap((mp) => {
                const m = mp.mascota;
                if (!m) return [];
                return [{
                    id: m.id,
                    nombre: m.nombre,
                    foto_url: m.foto_url,
                    edad: MascotaService.calcularEdad(m.fecha_nacimiento),
                    sexo: m.sexo as 'M' | 'H',
                    especie: m.raza.especie.especie,
                    raza: m.raza.raza,
                    esterilizado: m.es_castrado,
                    activo: mp.activo,
                }];
            }),
        };
    }

    /**
     * Crea un nuevo propietario.
     * @param data - Datos del nuevo propietario (insert type)
     * @param tx - Cliente de base de datos o transacción (opcional)
     * @returns El propietario creado
     */
    static async create(data: NewPropietario, tx?: DBClient): Promise<Propietario> {
        const client = tx || db;
        const [newPropietario] = await client.insert(propietarios).values(data).returning();
        return newPropietario;
    }

    /**
     * Actualiza un propietario existente.
     * @param id - ID del propietario
     * @param data - Datos a actualizar
     * @param tx - Cliente de base de datos o transacción (opcional)
     * @returns El propietario actualizado
     */
    static async update(id: string, data: Partial<NewPropietario>, tx?: DBClient): Promise<Propietario | null> {
        const client = tx || db;
        const [updated] = await client.update(propietarios)
            .set(data)
            .where(eq(propietarios.id, id))
            .returning();
        return updated || null;
    }

    /**
     * Verifica si un propietario está registrado para un usuario.
     * @param usuarioId - ID del usuario a verificar
     * @returns true si el propietario existe, false en caso contrario
     */
    static async existsById(usuarioId: string): Promise<boolean> {
        const propietario = await this.getByUsuarioId(usuarioId);
        return !!propietario;
    }
}
