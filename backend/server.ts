import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend API (Prisma/PostgreSQL) is running');
});

// Example route to get users
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
      },
    });

    res.json(user);
  } catch (error: any) {
    console.error(error);
    // Prisma error code P2002 means "Unique constraint failed"
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

const PORT = process.env.PORT || 5000;

// Test DB Connection and Start Server
prisma.$connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL Database');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err: any) => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });
