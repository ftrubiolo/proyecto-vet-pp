import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { prisma } from './prismaClient';
import usuariosRouter from './routes/usuarios';
import mascotasRouter from './routes/mascotas';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('Backend API (Prisma/PostgreSQL) is running');
});

// Use Routers
app.use('/usuarios', usuariosRouter);
app.use('/mascotas', mascotasRouter);

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
