import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = process.env.MINIO_PORT || '9000';
const accessKey = process.env.MINIO_ACCESS_KEY || 'vetvault';
const secretKey = process.env.MINIO_SECRET_KEY || 'vetvault-secret';
const bucket = process.env.MINIO_BUCKET || 'vetvault-fotos';
const publicUrl = process.env.MINIO_PUBLIC_URL || `http://localhost:9000/vetvault-fotos`;

const client = new S3Client({
  endpoint: `http://${endpoint}:${port}`,
  region: 'us-east-1',
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true,
});

export async function uploadToS3(
  key: string,
  buffer: Buffer,
  mimetype: string
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    })
  );

  return `${publicUrl}/${key}`;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

export { bucket };
