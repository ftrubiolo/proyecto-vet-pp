import express from 'express';
import { prisma } from '../prismaClient';
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const usuarios = await prisma.usuarios.findMany();
        return res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});


export default router;