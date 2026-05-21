import express from 'express';
import * as authController from '../controllers/auth.controller';

const router = express.Router();

// Rutas de autenticación
router.post('/registro/veterinario', authController.registrarVeterinario);
router.post('/registro/propietario', authController.registrarPropietario);
router.post('/login', authController.login);

export default router;
