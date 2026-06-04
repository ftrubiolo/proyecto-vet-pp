import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, roles, veterinarios, propietarios } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const registrarVeterinario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
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
        if (await Validation.existingUser(email, reply)) { reply.code(400).send({ message: "El correo ya existe" }); return; }

        // Hash de contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Obtener ID del rol
        const rolId = (await db.select({ id: roles.id }).from(roles).where(eq(roles.nombre, rol)).limit(1))[0].id;
        if (!rolId) return reply.code(400).send({ message: "Rol no encontrado" });

        // Crear usuario
        const user = (await db.insert(usuarios).values({
            email,
            password_hash: passwordHash,
            rol_id: rolId,
        }).returning({
            id: usuarios.id,
            email: usuarios.email
        }))[0];

        const profile = (await db.insert(propietarios).values({
            usuario_id: user.id,
            nombre: name,
            apellido: lastname,
            es_empresa: isCompany,
            razon_social: companyName,
            foto_url: foto,
            telefono: telefono,
            direccion: direccion,
        }).returning({
            id: propietarios.id
        }))[0];

        reply.code(201).send({
            message: "Propietario registrado exitosamente",
            user,
            profile,
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
        const isValid = bcrypt.compareSync(password, user.password_hash);
        if (!isValid) return reply.code(401).send({ message: "Contraseña incorrecta" });

        // Generar Token
        const token = jwt.sign({ id: user.id, email: user.email, rol_id: user.rol_id }, JWT_SECRET, { expiresIn: '1d' });

        // Sanitizar el objeto usuario (remover password_hash por seguridad)
        const { password_hash, fecha_creacion, ...safeUser } = user;

        // Establecer Cookie y responder
        return reply
            .code(200)
            .setCookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24,
                path: '/',
            })
            .send({
                message: "Usuario logueado exitosamente",
                user: safeUser
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

class Validation {
    static async existingUser(email: string, reply: FastifyReply): Promise<boolean> {
        const existingUser = await db.query.usuarios.findFirst({ where: eq(usuarios.email, email) });
        if (existingUser) return true;
        return false;
    }
}
