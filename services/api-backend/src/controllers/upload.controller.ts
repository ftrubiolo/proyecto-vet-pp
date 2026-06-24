import { FastifyRequest, FastifyReply } from 'fastify';
import { UploadService } from '../services/upload.service';

interface UploadParams {
  folder?: string;
}

export const uploadFile = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  try {
    const { folder } = request.query as UploadParams;

    const multipart = request as unknown as {
      file: () => Promise<{
        toBuffer: () => Promise<Buffer>;
        mimetype: string;
      } | undefined>;
    };

    const data = await multipart.file();

    if (!data) {
      return reply.code(400).send({ message: 'No se envió ningún archivo.' });
    }

    const buffer = await data.toBuffer();

    const result = await UploadService.processAndUpload(
      buffer,
      data.mimetype,
      folder || 'general'
    );

    return reply.code(200).send(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al subir archivo';
    return reply.code(400).send({ message });
  }
};
