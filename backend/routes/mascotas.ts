import express from 'express';
import { prisma } from '../prismaClient';

const router = express.Router();

// Register new pet
router.post('/', async (req, res) => {
    // Handle potential typo 'fechaNacimento' from the request
    const rawFechaNacimiento = req.body.fechaNacimiento || req.body.fechaNacimento;
    const { nombre, raza, razaId, sexo, propietarioId } = req.body;
    const edad = Date.now() - Date.parse(rawFechaNacimiento);

    try {
        const inputRazaId = razaId || raza;

        // El frontend probablemente envía el usuarioId como propietarioId
        const propietario = await prisma.propietarios.findUnique({
            where: { usuarioId: parseInt(propietarioId, 10) }
        });

        if (!propietario) {
            return res.status(400).json({ error: 'Propietario no encontrado para este usuario' });
        }

        const mascota = await prisma.mascotas.create({
            data: {
                nombre,
                razaId: parseInt(inputRazaId, 10),
                fechaNacimiento: new Date(rawFechaNacimiento),
                sexo,
                propietarioId: propietario.id
            }
        });
        res.json(mascota);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2003') {
            return res.status(400).json({ error: 'Error de llave foránea: verifique que la raza exista.' });
        }
        res.status(500).json({ error: 'Error creating pet' });
    }
});

// Get all pets
router.get('/', async (req, res) => {
    try {
        const mascotas = await prisma.mascotas.findMany();
        res.json(mascotas);
    } catch (error) {
        res.status(500).json({ error: 'Error getting pets' });
    }
});

export default router;
