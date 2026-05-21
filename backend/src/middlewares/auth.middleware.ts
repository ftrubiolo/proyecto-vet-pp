import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Definimos la forma de los datos que guardamos en el Token
export interface TokenPayload {
    id: number;
    vetId?: number;
    proId?: number;
    email: string;
    rol: string; // 'Veterinario', 'Propietario', 'Admin'
}

// 2. Extendemos el Request de Express para que acepte nuestra propiedad 'user'
export interface AuthRequest extends Request {
    user?: TokenPayload;
}

const JWT_SECRET = process.env.JWT_SECRET as string;

//
// Middleware para verificar si el usuario tiene un token válido
//
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: "Acceso denegado. No se proporcionó un token." });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        // console.log("Token decodificado exitosamente:", decoded);

        req.user = decoded;

        next();
    } catch (error: any) {
        res.status(403).json({
            error: "Token inválido o expirado.",
            detalle: error.message || error
        });
        return;
    }
};

//
// Middleware para autorizar según el rol del usuario
//
export const checkRole = (rolesPermitidos: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        // Validamos que exista req.user y que su rol esté en el array permitido
        if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
            res.status(403).json({ error: "No tienes los permisos necesarios para realizar esta acción." });
            return;
        }

        next();
    };
};