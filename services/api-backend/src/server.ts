import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import apiRoutes from './routes';

const app = fastify({ logger: true });

const start = async () => {
  try {
    await app.register(cookie, {
      secret: process.env.JWT_SECRET,
    });

    await app.register(cors, {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    });

    await app.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'VetVault API Documentation',
          description: 'Documentación interactiva de la API de VetVault',
          version: '1.0.0',
        },
      },
    });

    await app.register(fastifySwaggerUi, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
    });

    await app.register(multipart, {
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
      },
    });

    await app.register(apiRoutes, { prefix: '/api' });

    app.get("/api/health", async (request, reply) => {
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
