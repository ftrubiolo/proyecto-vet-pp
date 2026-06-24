import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { uploadToS3 } from './s3.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export interface UploadResult {
  url: string;
  key: string;
}

export class UploadService {
  static async processAndUpload(
    buffer: Buffer,
    mimetype: string,
    folder: string
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME.includes(mimetype)) {
      throw new Error(`Formato no soportado: ${mimetype}. Use JPEG, PNG o WebP.`);
    }

    if (buffer.length > MAX_SIZE) {
      throw new Error('La imagen supera el tamaño máximo de 5 MB.');
    }

    const processed = await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `${folder}/${randomUUID()}.webp`;

    const url = await uploadToS3(key, processed, 'image/webp');

    return { url, key };
  }
}
