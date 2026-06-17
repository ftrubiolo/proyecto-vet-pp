import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { suscripciones } from '../db/schema';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

// Initialize Mercado Pago client
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-MOCK-ACCESS-TOKEN',
});

/**
 * Creates a Mercado Pago Preapproval (Subscription) session and returns the redirect point.
 */
export const createCheckoutSession = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.code(401).send({ message: 'No autenticado' });
  }

  const { plan } = request.body as { plan: 'independent' | 'clinic_pro' };

  if (plan !== 'independent' && plan !== 'clinic_pro') {
    return reply.code(400).send({ message: 'Plan seleccionado inválido' });
  }

  const price = plan === 'independent' ? 19000 : 49000;
  const reason = plan === 'independent' ? 'VetVault - Plan Veterinario Independiente' : 'VetVault - Plan Clínica Pro';

  try {
    const preApproval = new PreApproval(client);
    const host = process.env.FRONTEND_URL || 'http://localhost:5173';
    let backUrl = `${host}/register/success`;
    if (backUrl.includes('localhost') || backUrl.includes('127.0.0.1')) {
      backUrl = 'https://vetvault.com/register/success';
    }

    const body = {
      payer_email: request.user.email,
      back_url: backUrl,
      reason: reason,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: price,
        currency_id: 'ARS',
      },
      status: 'pending',
      external_reference: request.user.id, // Pass user ID to map back on webhook trigger
    };

    const response = await preApproval.create({ body });
    const initPoint = response.init_point;

    // Check if the user already has a subscription entry in our database, update or create
    const existing = await db.select().from(suscripciones).where(eq(suscripciones.usuario_id, request.user.id)).limit(1);

    if (existing.length === 0) {
      await db.insert(suscripciones).values({
        usuario_id: request.user.id,
        estado: 'inactivo',
        plan: plan,
      });
    } else {
      await db.update(suscripciones)
        .set({ plan: plan })
        .where(eq(suscripciones.usuario_id, request.user.id));
    }

    return reply.code(200).send({ initPoint });
  } catch (error) {
    console.error('Error creating MP preapproval:', error);
    const message = error instanceof Error ? error.message : 'Error al inicializar el pago con Mercado Pago';
    return reply.code(500).send({ message });
  }
};

/**
 * Handles webhooks sent by Mercado Pago.
 */
export const handleMercadoPagoWebhook = async (request: FastifyRequest, reply: FastifyReply) => {
  const payload = request.body as any;
  console.log('Mercado Pago Webhook payload:', JSON.stringify(payload, null, 2));

  // Process subscription preapproval events
  if (payload.type === 'subscription_preapproval' && payload.data && payload.data.id) {
    const preapprovalId = payload.data.id;
    try {
      const preApproval = new PreApproval(client);
      const details = await preApproval.get({ id: preapprovalId });

      const userId = details.external_reference;
      const mpStatus = details.status; // 'authorized', 'paused', 'cancelled', 'pending'
      const payerId = details.payer_id ? String(details.payer_id) : null;

      if (userId) {
        let estado: 'activo' | 'impago' | 'cancelado' | 'inactivo' = 'inactivo';
        let gracePeriodStart: Date | null = null;
        let fechaExpiracion: Date | null = null;

        if (mpStatus === 'authorized') {
          estado = 'activo';
          const exp = new Date();
          exp.setMonth(exp.getMonth() + 1); // Subscriptions are monthly
          fechaExpiracion = exp;
        } else if (mpStatus === 'paused' || mpStatus === 'pending') {
          estado = 'impago';
          gracePeriodStart = new Date(); // Start the 7-day grace period
        } else if (mpStatus === 'cancelled') {
          estado = 'cancelado';
        }

        const existing = await db.select().from(suscripciones).where(eq(suscripciones.usuario_id, userId)).limit(1);

        if (existing.length > 0) {
          await db.update(suscripciones)
            .set({
              mp_preapproval_id: preapprovalId,
              mp_payer_id: payerId,
              estado: estado,
              fecha_expiracion: fechaExpiracion,
              grace_period_start: gracePeriodStart,
            })
            .where(eq(suscripciones.usuario_id, userId));
        } else {
          await db.insert(suscripciones).values({
            usuario_id: userId,
            mp_preapproval_id: preapprovalId,
            mp_payer_id: payerId,
            estado: estado,
            fecha_expiracion: fechaExpiracion,
            grace_period_start: gracePeriodStart,
          });
        }
        console.log(`Updated subscription database state for user ID ${userId} to ${estado}`);
      }
    } catch (error) {
      console.error('Error fetching subscription details from Mercado Pago API:', error);
    }
  }

  // Acknowledge receipt of the webhook by returning 200/201 status
  return reply.code(200).send({ ok: true });
};

/**
 * Fetches the current user's subscription details.
 */
export const getMySubscription = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.user) {
    return reply.code(401).send({ message: 'No autenticado' });
  }

  try {
    const sub = await db
      .select()
      .from(suscripciones)
      .where(eq(suscripciones.usuario_id, request.user.id))
      .limit(1);

    if (sub.length === 0) {
      return reply.code(200).send({ subscription: null });
    }

    return reply.code(200).send({ subscription: sub[0] });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return reply.code(500).send({ message: 'Error al obtener los detalles de la suscripción' });
  }
};
