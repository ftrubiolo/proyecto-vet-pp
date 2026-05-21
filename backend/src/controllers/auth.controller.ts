import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET as string;

export const registrarVeterinario = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Extraemos los datos del cuerpo de la petición
        const { email, password, nombre, apellido, numeroMatricula, telefono } = req.body;
        // Falta clinicaId, esta hardcodeada a 1 por ahora. 

        // 2. Validaciones básicas
        if (!email || !password || !nombre || !apellido || !numeroMatricula) {
            res.status(400).json({ error: 'Faltan campos obligatorios' });
            return;
        }

        // 3. Verificar que el email y matricula no esté en uso
        const usuarioExistente = await prisma.usuarios.findFirst({
            where: { email: email }
        });

        const veterinarioExistente = await prisma.veterinarios.findFirst({
            where: { numeroMatricula: numeroMatricula }
        });

        if (usuarioExistente || veterinarioExistente) {
            res.status(409).json({ error: 'El email o la matricula ya están registrados' });
            return;
        }

        // 4. Obtener el ID del Rol "Veterinario"
        const rolVeterinario = await prisma.roles.findFirst({
            where: { nombre: 'Veterinario' }
        });

        if (!rolVeterinario) {
            res.status(500).json({ error: 'Error interno: Rol de veterinario no encontrado en la base de datos' });
            return;
        }

        // 5. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 6. Crea el usuario y su perfil de veterinario
        const nuevoUsuario = await prisma.usuarios.create({
            data: {
                email: email,
                passwordHash: passwordHash,
                rolId: rolVeterinario.id,
                Veterinarios: {
                    create: {
                        nombre: nombre,
                        apellido: apellido,
                        clinicaId: 1,
                        numeroMatricula: numeroMatricula,
                        telefono: telefono
                    }
                }
            },
            include: {
                Veterinarios: true,
                Rol: true
            }
        });

        // 7. Generar el Token JWT para que quede logueado automáticamente (opcional)
        const token = jwt.sign(
            {
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.Rol.nombre
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 8. Responder con éxito
        res.status(201).json({
            mensaje: 'Veterinario registrado exitosamente',
            token,
            usuario: {
                id: nuevoUsuario.id,
                email: nuevoUsuario.email,
                rol: nuevoUsuario.Rol.nombre,
                perfil: nuevoUsuario.Veterinarios[0]
            }
        });

    } catch (error) {
        console.error('Error al registrar veterinario:', error);
        res.status(500).json({ error: 'Ocurrió un error al procesar el registro' });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        // 1. Validar que vengan los datos
        if (!email || !password) {
            res.status(400).json({ error: 'El email y la contraseña son obligatorios' });
            return;
        }

        // 2. Buscar al usuario en la base de datos por su Email
        const usuario = await prisma.usuarios.findFirst({
            where: { email: email },
            include: { Rol: true }
        });

        if (!usuario) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // 3. Comparar la contraseña ingresada con el PasswordHash de la base de datos
        const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

        if (!passwordValido) {
            res.status(401).json({ error: 'Credenciales inválidas' });
            return;
        }

        // 4. Generamos el Token JWT
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.Rol.nombre
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Devolvemos el token y los datos básicos
        res.status(200).json({
            mensaje: 'Login exitoso',
            token,
            usuario: {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.Rol.nombre
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ error: 'Ocurrió un error al procesar el login' });
    }
};