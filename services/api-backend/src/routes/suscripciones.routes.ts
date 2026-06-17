import { FastifyInstance } from 'fastify';
import { verifyToken } from '../middlewares/auth.middleware';
import * as controller from '../controllers/suscripciones.controller';
import { db } from '../db/index.js';
import { suscripciones } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export default async function suscripcionesRoutes(fastify: FastifyInstance) {
  // Checkout creation (Guarded)
  fastify.post('/checkout', { preHandler: verifyToken, schema: checkoutSchema }, controller.createCheckoutSession);

  // Get active user's subscription (Guarded)
  fastify.get('/mi-suscripcion', { preHandler: verifyToken }, controller.getMySubscription);

  // Webhook listener (Public)
  fastify.post('/webhooks/mercadopago', controller.handleMercadoPagoWebhook);

  // Dev bypass (only in development)
  if (process.env.NODE_ENV === 'dev' || !process.env.NODE_ENV) {
    fastify.post('/dev-bypass', { preHandler: verifyToken }, async (request, reply) => {
      if (!request.user) return reply.code(401).send({ message: 'No autorizado' });

      const existing = await db.select().from(suscripciones).where(eq(suscripciones.usuario_id, request.user.id)).limit(1);

      if (existing.length > 0) {
        await db.update(suscripciones)
          .set({ estado: 'activo', plan: 'clinic_pro', grace_period_start: null })
          .where(eq(suscripciones.usuario_id, request.user.id));
      } else {
        await db.insert(suscripciones).values({
          usuario_id: request.user.id,
          estado: 'activo',
          plan: 'clinic_pro',
        });
      }

      return { success: true };
    });
  }
}

const checkoutSchema = {
  body: {
    type: 'object',
    required: ['plan'],
    properties: {
      plan: { type: 'string', enum: ['independent', 'clinic_pro'] },
    },
  },
};
