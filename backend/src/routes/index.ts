import express from 'express';
const router = express.Router();

import authRoutes from './auth.routes';
import veterinariosRoutes from './veterinarios.routes';
import propietariosRoutes from './propietarios.routes';
import usuariosRoutes from './usuarios.routes';

router.use('/auth', authRoutes);
router.use('/veterinarios', veterinariosRoutes);
router.use('/propietarios', propietariosRoutes);
router.use('/usuarios', usuariosRoutes);

export default router;