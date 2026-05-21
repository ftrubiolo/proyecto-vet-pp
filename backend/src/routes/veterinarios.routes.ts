import express from 'express';
import { obtenerPerfil } from '../controllers/veterinarios.controller';
import { verifyToken } from '../middlewares/auth.middleware';
const router = express.Router();

// Rutas de veterinarios
router.get('/:id', verifyToken, obtenerPerfil);

export default router;
