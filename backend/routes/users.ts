import express from 'express';
import { prisma } from '../prismaClient';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.usuarios.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await prisma.usuarios.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { email, password, rol } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }
    if (!rol) {
      return res.status(400).json({ error: 'rol is required' });
    }

    const user = await prisma.usuarios.create({
      data: {
        email,
        passwordHash: password,
        rol: parseInt(rol, 10),
      },
    });

    res.json(user);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
