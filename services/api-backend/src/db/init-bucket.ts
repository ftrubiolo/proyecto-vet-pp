import 'dotenv/config';
import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = process.env.MINIO_PORT || '9000';
const accessKey = process.env.MINIO_ACCESS_KEY || 'vetvault';
const secretKey = process.env.MINIO_SECRET_KEY || 'vetvault-secret';
const bucket = process.env.MINIO_BUCKET || 'vetvault-fotos';

const client = new S3Client({
  endpoint: `http://${endpoint}:${port}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true,
});

async function main() {
  console.log(`⏳ Verificando bucket '${bucket}' en MinIO (${endpoint}:${port})...`);

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`✅ El bucket '${bucket}' ya existe.`);
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      console.log(`📦 Creando bucket '${bucket}'...`);
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`✅ Bucket '${bucket}' creado exitosamente.`);
    } else {
      console.error('Error al consultar bucket:', error);
      throw error;
    }
  }

  // Configurar política de lectura pública para las fotos
  console.log(`🔓 Configurando política de lectura pública para '${bucket}'...`);
  const publicPolicy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  };

  try {
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify(publicPolicy),
      })
    );
    console.log(`✅ Política pública aplicada con éxito en '${bucket}'.`);
  } catch (policyErr: any) {
    console.warn('⚠️ No se pudo aplicar política pública directamente:', policyErr.message);
  }

  console.log('🎉 Bucket listo para usar.');
}

main().catch((err) => {
  console.error('❌ Falló la inicialización del bucket:', err);
  process.exit(1);
});
