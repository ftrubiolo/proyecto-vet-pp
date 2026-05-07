import express from 'express';
import { prisma } from '../prismaClient';

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.usuarios.findMany({
      include: {
        Veterinarios: true,
        Propietarios: true,
      },
    });

    const formattedUsers = users.map(user => {
      const { passwordHash, Veterinarios, Propietarios, ...userData } = user;
      
      if (user.rolId === 1 && Veterinarios.length > 0) {
        const vet = Veterinarios[0];
        return {
          ...userData,
          nombre: vet.nombre,
          apellido: vet.apellido,
          telefono: vet.telefono,
          numeroMatricula: vet.numeroMatricula,
        };
      } else if (user.rolId === 2 && Propietarios.length > 0) {
        const prop = Propietarios[0];
        return {
          ...userData,
          nombre: prop.nombre,
          apellido: prop.apellido,
          telefono: prop.telefono,
          direccion: prop.direccion,
        };
      }
      return userData;
    });

    res.json(formattedUsers);
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
      include: {
        Veterinarios: true,
        Propietarios: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { passwordHash, Veterinarios, Propietarios, ...userData } = user;
    let formattedUser: any = { ...userData };

    if (user.rolId === 1 && Veterinarios.length > 0) {
      const vet = Veterinarios[0];
      formattedUser = {
        ...formattedUser,
        nombre: vet.nombre,
        apellido: vet.apellido,
        telefono: vet.telefono,
        numeroMatricula: vet.numeroMatricula,
      };
    } else if (user.rolId === 2 && Propietarios.length > 0) {
      const prop = Propietarios[0];
      formattedUser = {
        ...formattedUser,
        nombre: prop.nombre,
        apellido: prop.apellido,
        telefono: prop.telefono,
        direccion: prop.direccion,
      };
    }

    res.json(formattedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  try {
    const { email, password, rol, rolId, clinicaId, nombre, apellido, telefono, direccion, numeroMatricula } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }
    if (!password) {
      return res.status(400).json({ error: 'La contraseña es obligatoria' });
    }
    const inputRol = rol || rolId;
    if (!inputRol) {
      return res.status(400).json({ error: 'El rol es obligatorio' });
    }

    const rolInt = parseInt(inputRol, 10);
    const userData: any = {
      email,
      passwordHash: password,
      rolId: rolInt,
    };

    if (rolInt === 1) {
      if (!nombre || !apellido || !telefono || !numeroMatricula || !clinicaId) {
        return res.status(400).json({ error: 'Faltan datos (nombre, apellido, telefono, numeroMatricula, clinicaId) para Veterinario' });
      }
      userData.Veterinarios = {
        create: { nombre, apellido, telefono, numeroMatricula, clinicaId: parseInt(clinicaId, 10) }
      };
    } else if (rolInt === 2) {
      if (!nombre || !apellido || !telefono || !direccion) {
        return res.status(400).json({ error: 'Faltan datos (nombre, apellido, telefono, direccion) para Propietario' });
      }
      userData.Propietarios = {
        create: { nombre, apellido, telefono, direccion }
      };
    }

    const user = await prisma.usuarios.create({
      data: userData,
    });

    res.json(user);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });
    }
    res.status(500).json({ error: 'No se pudo crear el usuario' });
  }
});

export default router;
