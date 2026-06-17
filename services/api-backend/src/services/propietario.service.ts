import { db } from "../db";
import { eq, or, ilike } from "drizzle-orm";
import { mascotas_propietarios, propietarios, usuarios } from "../db/schema";
import { MascotaService } from "./mascota.service";

import type { PropietarioList, PropietarioPerfil } from "@vetvault/shared";
import type { PropietarioDb, NewPropietario, DBClient } from '../types/db.types';

/**
 * Servicio para la gestión de propietarios.
 */
export class PropietarioService {
    /**
     * Busca propietarios por nombre, apellido, teléfono o email.
     * @param queryStr - Término de búsqueda
     * @returns Array de propietarios con su email
     */
    static async search(queryStr: string): Promise<any[]> {
        const searchTerm = `%${queryStr.trim()}%`;
        return await db
            .select({
                id: propietarios.id,
                nombre: propietarios.nombre,
                apellido: propietarios.apellido,
                telefono: propietarios.telefono,
                email: usuarios.email,
            })
            .from(propietarios)
            .innerJoin(usuarios, eq(propietarios.usuario_id, usuarios.id))
            .where(
                or(
                    ilike(propietarios.nombre, searchTerm),
                    ilike(propietarios.apellido, searchTerm),
                    ilike(propietarios.telefono, searchTerm),
                    ilike(usuarios.email, searchTerm)
                )
            )
            .limit(10);
    }

    /**
     * Obtiene el ID de un propietario por ID de usuario.
     * @param usuarioId - ID del usuario
     * @returns ID del propietario o null si no existe
     */
    static async getIdByUsuarioId(usuarioId: string): Promise<string | null> {
        const result = await db.query.propietarios.findFirst({
            where: eq(propietarios.usuario_id, usuarioId),
            columns: {
                id: true,
            }
        });
        return result?.id || null;
    }
    /**
     * Obtiene todos los propietarios.
     * @returns Array de propietarios -> {@link Propietario}
     */
    static async getAll(): Promise<PropietarioList[]> {
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
    static async getById(id: string): Promise<PropietarioPerfil | null> {
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
    static async getByUsuarioId(usuarioId: string): Promise<PropietarioPerfil | null> {
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
    static async create(data: NewPropietario, tx?: DBClient): Promise<NewPropietario> {
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
    static async update(id: string, data: Partial<NewPropietario>, tx?: DBClient): Promise<PropietarioDb | null> {
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
