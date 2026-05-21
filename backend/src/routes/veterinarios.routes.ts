import express from 'express';
import { obtenerPerfil } from '../controllers/veterinarios.controller';
import { verifyToken, checkRole } from '../middlewares/auth.middleware';
const router = express.Router();

// Rutas de veterinarios
router.get('/:id', verifyToken, checkRole(['Veterinario']), obtenerPerfil);

export default router;
