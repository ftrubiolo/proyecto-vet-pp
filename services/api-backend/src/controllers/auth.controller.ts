import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, veterinarios, propietarios, clinicas, veterinarios_clinicas } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RolService } from '../services/rol.service';
import { Validation } from '../utils/validation';
import { UserService } from '../services/user.service';
import { VetService } from '../services/vet.service';
import { ClinicaService } from '../services/clinica.service';
import { PropietarioService } from '../services/prop.service';

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

        // Validar matrícula contra el registro de Córdoba
        if (!(await Validation.isValidMatricula(veterinario.numero_matricula))) {
            return reply.code(400).send({ message: "El número de matrícula no está habilitado o no es válido en el registro oficial" });
        }

        // Hash de contraseña
        const passwordHash = await bcrypt.hash(usuario.password, 10);

        // Obtener ID del rol
        const rolId = await RolService.getIdByRol('Veterinario');
        if (!rolId) return reply.code(400).send({ message: "Rol no encontrado" });

        // Crear usuario, transaccion por si alguno falla
        const result = await db.transaction(async (tx) => {
            const newUser = await UserService.create({
                email: usuario.email,
                password_hash: passwordHash,
                rol_id: rolId,
            }, tx);

            const newVeterinario = await VetService.create({
                usuario_id: newUser.id,
                nombre: veterinario.nombre,
                apellido: veterinario.apellido,
                foto_url: veterinario.foto,
                numero_matricula: veterinario.numero_matricula,
                telefono: veterinario.telefono,
            }, tx);

            const newClinica = await ClinicaService.create({
                nombre_comercial: clinica.nombre,
                direccion: clinica.direccion,
                telefono: clinica.telefono,
            }, tx);

            await VetService.associateWithClinica(newVeterinario.id, newClinica.id, tx);

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
        const rolId = await RolService.getIdByRol('Propietario');
        if (!rolId) return reply.code(400).send({ message: "Rol no encontrado" });

        // Crear usuario, transaccion por si alguno falla
        const result = await db.transaction(async (tx) => {
            const newUser = await UserService.create({
                email,
                password_hash: passwordHash,
                rol_id: rolId,
            }, tx);

            const newPropietario = await PropietarioService.create({
                usuario_id: newUser.id,
                nombre: name,
                apellido: lastname,
                es_empresa: isCompany,
                razon_social: companyName,
                foto_url: foto,
                telefono: telefono,
                direccion: direccion,
            }, tx);

            return { user: newUser, profile: newPropietario };
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

interface InvitationPayload {
    clinicaId: string;
    invitedBy?: string;
    type?: string;
}

export const registrarVeterinarioUnirse = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const { token, usuario, veterinario } = request.body as {
        token: string;
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
    };

    try {
        // 1. Verificar y decodificar el token de invitación
        let payload: InvitationPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET) as InvitationPayload;
        } catch (err) {
            return reply.code(400).send({ message: "El token de invitación es inválido o ha expirado" });
        }

        if (payload.type !== 'clinic_invitation' || !payload.clinicaId) {
            return reply.code(400).send({ message: "El token de invitación no es válido para unirse a una clínica" });
        }

        const clinicaId = payload.clinicaId;

        // 2. Verificar que la clínica exista
        const clinic = await db.query.clinicas.findFirst({
            where: eq(clinicas.id, clinicaId)
        });
        if (!clinic) {
            return reply.code(400).send({ message: "La clínica especificada en la invitación no existe" });
        }

        // 3. Verificar si el correo ya existe
        if (await Validation.existingUser(usuario.email)) {
            return reply.code(400).send({ message: "El correo ya existe" });
        }

        // 4. Validar matrícula contra el registro de Córdoba
        if (!(await Validation.isValidMatricula(veterinario.numero_matricula))) {
            return reply.code(400).send({ message: "El número de matrícula no está habilitado o no es válido en el registro oficial" });
        }

        // 5. Hash de contraseña
        const passwordHash = await bcrypt.hash(usuario.password, 10);

        // 6. Obtener ID del rol
        const rolId = await RolService.getIdByRol('Veterinario');
        if (!rolId) return reply.code(400).send({ message: "Rol no encontrado" });

        // 7. Crear usuario y asociarlo a la clínica dentro de una transacción
        const result = await db.transaction(async (tx) => {
            const newUser = await UserService.create({
                email: usuario.email,
                password_hash: passwordHash,
                rol_id: rolId,
            }, tx);

            const newVeterinario = await VetService.create({
                usuario_id: newUser.id,
                nombre: veterinario.nombre,
                apellido: veterinario.apellido,
                foto_url: veterinario.foto,
                numero_matricula: veterinario.numero_matricula,
                telefono: veterinario.telefono,
            }, tx);

            await VetService.associateWithClinica(newVeterinario.id, clinicaId, tx);

            return { user: newUser, veterinario: newVeterinario };
        });

        reply.code(201).send({
            message: "Veterinario registrado y unido a la clínica exitosamente",
            ...result,
            clinica: {
                id: clinicaId,
                nombre: clinic.nombre_comercial
            }
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

        const rolNombre = await RolService.getRolById(user.rol_id);
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

