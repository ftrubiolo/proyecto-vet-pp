import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import apiRoutes from './routes';

const app = fastify({ logger: true });

const start = async () => {
  try {
    await app.register(cors, {
      origin: "*",
    });

    await app.register(apiRoutes, { prefix: '/api' });

    app.get("/", async (request, reply) => {
      return { message: 'Backend API esta funcionando.' };
    });

    const PORT = parseInt(process.env.PORT || '5000', 10);
    await app.listen({ port: PORT, host: '0.0.0.0' });

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
