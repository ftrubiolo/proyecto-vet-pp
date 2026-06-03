import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { usuarios, roles, veterinarios, propietarios } from '../db/schema';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const registrarVeterinario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        // 1. Extraemos los datos del cuerpo de la petición
        const { email, password, nombre, apellido, numeroMatricula, telefono } = request.body as any;

        // 2. Validaciones básicas
        if (!email || !password || !nombre || !apellido || !numeroMatricula) {
            reply.code(400).send({ error: 'Faltan campos obligatorios' });
            return;
        }

        // 3. Verificar que el email y matricula no estén en uso
        const usuarioExistente = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, email)
        });

        const veterinarioExistente = await db.query.veterinarios.findFirst({
            where: eq(veterinarios.numeroMatricula, numeroMatricula)
        });

        if (usuarioExistente || veterinarioExistente) {
            reply.code(409).send({ error: 'El email o la matricula ya están registrados' });
            return;
        }

        // 4. Obtener el ID del Rol "Veterinario"
        const rolVeterinario = await db.query.roles.findFirst({
            where: eq(roles.nombre, 'Veterinario')
        });

        if (!rolVeterinario) {
            reply.code(500).send({ error: 'Error interno: Rol de veterinario no encontrado en la base de datos' });
            return;
        }

        // 5. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 6. Crea el usuario y su perfil de veterinario (en transacción para atomicidad)
        const { nuevoUsuario, nuevoVeterinario } = await db.transaction(async (tx) => {
            const [insertedUser] = await tx.insert(usuarios).values({
                email,
                passwordHash,
                rolId: rolVeterinario.id
            }).returning();

            const [insertedVet] = await tx.insert(veterinarios).values({
                usuarioId: insertedUser.id,
                nombre,
                apellido,
                clinicaId: 1, // Clínica default
                numeroMatricula,
                telefono
            }).returning();

            return { nuevoUsuario: insertedUser, nuevoVeterinario: insertedVet };
        });

        // 7. Generar el Token JWT
        const token = jwt.sign(
            {
                id: nuevoUsuario.id,
                vetId: nuevoVeterinario.id,
                email: nuevoUsuario.email,
                rol: rolVeterinario.nombre
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 8. Responder con éxito
        reply.code(201).send({
            mensaje: 'Veterinario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                rol: rolVeterinario.nombre,
                perfil: nuevoVeterinario
            }
        });

    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Ocurrió un error al procesar el registro' });
    }
};

export const registrarPropietario = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        // 1. Extraemos los datos del cuerpo de la petición
        const { email, password, nombre, apellido, telefono } = request.body as any;

        // 2. Validaciones básicas
        if (!email || !password || !nombre || !apellido) {
            reply.code(400).send({ error: 'Faltan campos obligatorios' });
            return;
        }

        // 3. Verificar que el email no esté en uso
        const usuarioExistente = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, email)
        });

        if (usuarioExistente) {
            reply.code(409).send({ error: 'El email ya está registrado' });
            return;
        }

        // 4. Obtener el ID del Rol "Propietario"
        const rolPropietario = await db.query.roles.findFirst({
            where: eq(roles.nombre, 'Propietario')
        });

        if (!rolPropietario) {
            reply.code(500).send({ error: 'Error interno: Rol de propietario no encontrado en la base de datos' });
            return;
        }

        // 5. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 6. Crea el usuario y su perfil de propietario (en transacción para atomicidad)
        const { nuevoUsuario, nuevoPropietario } = await db.transaction(async (tx) => {
            const [insertedUser] = await tx.insert(usuarios).values({
                email,
                passwordHash,
                rolId: rolPropietario.id
            }).returning();

            const [insertedProp] = await tx.insert(propietarios).values({
                usuarioId: insertedUser.id,
                nombre,
                apellido,
                telefono
            }).returning();

            return { nuevoUsuario: insertedUser, nuevoPropietario: insertedProp };
        });

        // 7. Generar el Token JWT
        const token = jwt.sign(
            {
                id: nuevoUsuario.id,
                proId: nuevoPropietario.id,
                email: nuevoUsuario.email,
                rol: rolPropietario.nombre
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 8. Responder con éxito
        reply.code(201).send({
            mensaje: 'Propietario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                rol: rolPropietario.nombre,
                perfil: nuevoPropietario
            }
        });

    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Ocurrió un error al procesar el registro' });
    }
};

export const login = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
        const { email, password } = request.body as any;

        // 1. Validar que vengan los datos
        if (!email || !password) {
            reply.code(400).send({ error: 'El email y la contraseña son obligatorios' });
            return;
        }

        // 2. Buscar al usuario en la base de datos por su Email con rol y perfiles
        const usuario = await db.query.usuarios.findFirst({
            where: eq(usuarios.email, email),
            with: {
                rol: true,
                veterinarios: true,
                propietarios: true
            }
        });

        if (!usuario) {
            reply.code(401).send({ error: 'Credenciales inválidas' });
            return;
        }

        // 3. Comparar la contraseña ingresada con el PasswordHash de la base de datos
        const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

        if (!passwordValido) {
            reply.code(401).send({ error: 'Credenciales inválidas' });
            return;
        }

        // 4. Capturar IDs de perfil si existen
        const vetId = usuario.veterinarios?.[0]?.id;
        const proId = usuario.propietarios?.[0]?.id;

        // 5. Generamos el Token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol.nombre,
                ...(vetId && { vetId }),
                ...(proId && { proId }),
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 6. Devolvemos el token y los datos básicos
        reply.code(200).send({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol.nombre
            }
        });

    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Ocurrió un error al procesar el login' });
    }
};