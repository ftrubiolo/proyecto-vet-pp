import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, veterinarios, propietarios, clinicas, veterinarios_clinicas } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RoleService } from '../services/role.service';
import { Validation } from '../utils/validation';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const registrarVeterinario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { usuario, veterinario, clinica } = request.body as {
        usuario: {
            email: string;
            password: string;
            rol: string;
        };
        veterinario: {
            nombre: string;
            apellido: string;
            foto?: string;
            numero_matricula: string;
            telefono: string;
        };
        clinica: {
            nombre: string;
            direccion: string;
            telefono: string;
        };
    };

    try {
        // Verificar si el correo existe
        if (await Validation.existingUser(usuario.email)) return reply.code(400).send({ message: "El correo ya existe" });

        // Hash de contraseña
        const passwordHash = await bcrypt.hash(usuario.password, 10);

        // Obtener ID del rol
        const rolId = await RoleService.getIdByName(usuario.rol);
        if (!rolId) return reply.code(400).send({ message: "Rol no encontrado" });

        // Crear usuario, transaccion por si alguno falla
        const result = await db.transaction(async (tx) => {
            const [newUser] = await tx.insert(usuarios).values({
                email: usuario.email,
                password_hash: passwordHash,
                rol_id: rolId,
            }).returning({
                id: usuarios.id,
                email: usuarios.email
            });

            const [newVeterinario] = await tx.insert(veterinarios).values({
                usuario_id: newUser.id,
                nombre: veterinario.nombre,
                apellido: veterinario.apellido,
                foto_url: veterinario.foto,
                numero_matricula: veterinario.numero_matricula,
                telefono: veterinario.telefono,
            }).returning({
                id: veterinarios.id
            });

            const [newClinica] = await tx.insert(clinicas).values({
                nombre_comercial: clinica.nombre,
                direccion: clinica.direccion,
                telefono: clinica.telefono,
            }).returning({
                id: clinicas.id
            });

            await tx.insert(veterinarios_clinicas).values({
                veterinario_id: newVeterinario.id,
                clinica_id: newClinica.id,
            });

            return { user: newUser, veterinario: newVeterinario, clinica: newClinica };
        });

        reply.code(201).send({
            message: "Veterinario registrado exitosamente",
            ...result
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
};

export const registrarPropietario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { email, password, rol, name, lastname, isCompany, companyName, foto, telefono, direccion } = request.body as {
        email: string;
        password: string;
        rol: string;
        name: string;
        lastname: string;
        isCompany: boolean;
        companyName?: string;
        foto?: string;
        telefono: string;
        direccion?: string;
    };

    try {
        // Verificar si el correo existe
        if (await Validation.existingUser(email)) return reply.code(400).send({ message: "El correo ya existe" });

        // Hash de contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Obtener ID del rol
        const rolId = await RoleService.getIdByName(rol);
        if (!rolId) return reply.code(400).send({ message: "Rol no encontrado" });

        // Crear usuario, transaccion por si alguno falla
        const result = await db.transaction(async (tx) => {
            const [newUser] = await tx.insert(usuarios).values({
                email,
                password_hash: passwordHash,
                rol_id: rolId,
            }).returning({
                id: usuarios.id,
                email: usuarios.email
            });

            const [newProfile] = await tx.insert(propietarios).values({
                usuario_id: newUser.id,
                nombre: name,
                apellido: lastname,
                es_empresa: isCompany,
                razon_social: companyName,
                foto_url: foto,
                telefono: telefono,
                direccion: direccion,
            }).returning({
                id: propietarios.id
            });

            return { user: newUser, profile: newProfile };
        });

        reply.code(201).send({
            message: "Propietario registrado exitosamente",
            ...result
        });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
};

export const login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { email, password } = request.body as {
        email: string;
        password: string;
    };

    try {
        // Buscar usuario
        const user = await db.query.usuarios.findFirst({ where: eq(usuarios.email, email), });
        if (!user) return reply.code(404).send({ message: "Usuario no encontrado" });

        // Verificar contraseña
        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return reply.code(401).send({ message: "Contraseña incorrecta" });

        const rolNombre = await RoleService.getNameById(user.rol_id);
        if (!rolNombre) return reply.code(404).send({ message: "Rol no encontrado" });

        // Generar Token
        const token = jwt.sign({ id: user.id, email: user.email, rol: rolNombre }, JWT_SECRET, { expiresIn: '1d' });

        // Sanitizar el objeto usuario (remover password_hash por seguridad)
        const { password_hash, fecha_creacion, rol_id, ...safeUser } = user;

        const responseUser = {
            ...safeUser,
            rol: rolNombre
        };

        // Establecer Cookie y responder
        return reply
            .code(200)
            .setCookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 60 * 60 * 24,
                path: '/',
            })
            .send({
                message: "Usuario logueado exitosamente",
                user: responseUser
            });

    } catch (error) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        reply.code(500).send({ message });
    }
};

export const logout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    return reply
        .clearCookie('token', { path: '/' })
        .code(200)
        .send({ message: 'Sesión cerrada exitosamente' });
};

