import 'dotenv/config';
import { MercadoPagoConfig, PreApproval } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN || '',
});

const emails = [
  "test_user_250604491399622@testuser.com",
  "TESTUSER250604491399622@testuser.com",
  "test_user_25060449@testuser.com",
  "TESTUSER25060449@testuser.com",
];

async function tryEmail(email: string) {
  try {
    const preApproval = new PreApproval(client);
    const body = {
      payer_email: email,
      back_url: "https://vetvault.com/register/success",
      reason: "VetVault - Plan Clínica Pro",
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 49000,
        currency_id: 'ARS',
      },
      status: 'pending',
      external_reference: "test-user-id",
    };

    const response = await preApproval.create({ body });
    console.log(`Success with email [${email}]:`, response.init_point);
    return true;
  } catch (error: any) {
    console.log(`Failed with email [${email}]:`, error.status, error.message);
    return false;
  }
}

async function run() {
  for (const email of emails) {
    console.log(`Testing email: ${email}`);
    const ok = await tryEmail(email);
    if (ok) break;
  }
}

run();
