import { FastifyReply } from 'fastify';

/**
 * Custom error class for operational/domain errors with explicit HTTP status codes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

interface SanitizedError {
  message: string;
  statusCode: number;
}

/**
 * Determines whether an error message is clean and safe to be exposed to client UIs.
 */
function isSafeMessage(msg: string): boolean {
  if (!msg || typeof msg !== 'string') return false;
  if (msg.length > 250) return false;

  const lower = msg.toLowerCase();
  const unsafePatterns = [
    'failed query:',
    'insert into',
    'select ',
    'update ',
    'delete from',
    'syntax error',
    'relation "',
    'column "',
    'table "',
    'violates foreign key',
    'violates unique',
    'violates not-null',
    'typeerror:',
    'referenceerror:',
    'syntaxerror:',
    'node_modules',
    'econnrefused',
    'enotfound',
    'etimedout',
    'at object.',
    'at async',
    'postgres://',
    'postgresql://',
    'drizzle',
    '.ts:',
    '.js:',
  ];

  return !unsafePatterns.some((pattern) => lower.includes(pattern));
}

/**
 * Sanitizes any error (PostgreSQL error, Drizzle query failure, Fastify error, or unknown)
 * into a client-safe error message and standard HTTP status code.
 */
export function sanitizeApiError(error: unknown, fallbackMessage?: string): SanitizedError {
  if (!error) {
    return {
      message: fallbackMessage || 'Ocurrió un error inesperado.',
      statusCode: 500,
    };
  }

  // Explicit AppError
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  const errObj = error as Record<string, any>;
  const cause = errObj.cause as Record<string, any> | undefined;

  // Extract PostgreSQL error code (may reside on error or cause)
  const pgCode = String(errObj.code || cause?.code || '');
  const detail = String(errObj.detail || cause?.detail || '').toLowerCase();
  const rawMessage = error instanceof Error ? error.message : String(error);
  const rawLower = rawMessage.toLowerCase();
  const column = errObj.column || errObj.column_name || cause?.column || cause?.column_name;

  // 1. PostgreSQL known SQLSTATE error codes
  if (pgCode) {
    switch (pgCode) {
      // Unique constraint violation (23505)
      case '23505': {
        let msg = 'Ya existe un registro con esos datos en el sistema.';
        if (detail.includes('email') || rawLower.includes('email')) {
          msg = 'El correo electrónico ya se encuentra registrado.';
        } else if (detail.includes('matricula') || rawLower.includes('matricula')) {
          msg = 'La matrícula profesional ya se encuentra registrada.';
        } else if (detail.includes('microchip') || rawLower.includes('microchip')) {
          msg = 'El número de microchip ya se encuentra registrado para otra mascota.';
        } else if (detail.includes('dni') || detail.includes('cuit') || rawLower.includes('dni') || rawLower.includes('cuit')) {
          msg = 'El documento de identidad o CUIT ya se encuentra registrado.';
        }
        return { message: msg, statusCode: 409 };
      }

      // Foreign key constraint violation (23503)
      case '23503': {
        let msg = 'Uno de los registros relacionados no existe o no es válido.';
        if (detail.includes('raza') || rawLower.includes('raza')) {
          msg = 'La raza seleccionada no existe o no es válida.';
        } else if (detail.includes('especie') || rawLower.includes('especie')) {
          msg = 'La especie seleccionada no existe o no es válida.';
        } else if (detail.includes('clinica') || rawLower.includes('clinica')) {
          msg = 'La clínica asociada no existe o no es válida.';
        } else if (detail.includes('propietario') || rawLower.includes('propietario')) {
          msg = 'El propietario asociado no existe o no es válido.';
        } else if (detail.includes('veterinario') || rawLower.includes('veterinario')) {
          msg = 'El profesional veterinario asociado no existe o no es válido.';
        } else if (detail.includes('mascota') || rawLower.includes('mascota')) {
          msg = 'La mascota seleccionada no existe o no es válida.';
        } else if (detail.includes('usuario') || rawLower.includes('usuario')) {
          msg = 'El usuario asociado no existe o no es válido.';
        }
        return { message: msg, statusCode: 400 };
      }

      // Not-null constraint violation (23502)
      case '23502': {
        const msg = column
          ? `El campo '${column}' es obligatorio.`
          : 'Faltan campos obligatorios para completar la operación.';
        return { message: msg, statusCode: 400 };
      }

      // String data right truncation / value too long (22001)
      case '22001':
        return {
          message: 'Uno o más campos superan la longitud máxima de caracteres permitida.',
          statusCode: 400,
        };

      // Invalid text representation / UUID / integer syntax (22P02)
      case '22P02':
        return {
          message: 'Uno o más datos contienen un formato o identificador no válido.',
          statusCode: 400,
        };

      // Invalid datetime format (22007)
      case '22007':
        return {
          message: 'El formato de fecha proporcionado no es válido.',
          statusCode: 400,
        };

      // Check constraint violation (23514)
      case '23514':
        return {
          message: 'Los datos enviados no cumplen con los requisitos del sistema.',
          statusCode: 400,
        };

      // Connection / database network failures
      case '08000':
      case '08003':
      case '08006':
      case '08001':
      case '08004':
      case '57P01':
        return {
          message: 'Error de comunicación con la base de datos. Por favor, reintente más tarde.',
          statusCode: 503,
        };
    }
  }

  // 2. Fastify validation errors
  if (errObj.validation) {
    return {
      message: 'Los datos enviados en la solicitud no son válidos.',
      statusCode: 400,
    };
  }

  // 3. Fastify HTTP status errors (e.g. 404, 403, 401, 413)
  if (typeof errObj.statusCode === 'number' && errObj.statusCode >= 400 && errObj.statusCode < 500) {
    const isSafe = isSafeMessage(rawMessage);
    let msg = isSafe ? rawMessage : 'Solicitud no válida.';
    if (!isSafe) {
      if (errObj.statusCode === 404) msg = 'Recurso no encontrado.';
      if (errObj.statusCode === 401) msg = 'No autorizado.';
      if (errObj.statusCode === 403) msg = 'Acceso denegado.';
    }
    return { message: msg, statusCode: errObj.statusCode };
  }

  // 4. Raw Drizzle or SQL query leaks without code
  if (
    rawLower.includes('failed query:') ||
    rawLower.includes('insert into') ||
    rawLower.includes('select ') ||
    rawLower.includes('update ') ||
    rawLower.includes('delete from') ||
    rawLower.includes('relation "') ||
    rawLower.includes('syntax error at')
  ) {
    return {
      message: fallbackMessage || 'Ocurrió un error al procesar la operación en la base de datos.',
      statusCode: 500,
    };
  }

  // 5. Connection error keywords in message
  if (
    rawLower.includes('econnrefused') ||
    rawLower.includes('enotfound') ||
    rawLower.includes('etimedout')
  ) {
    return {
      message: 'No se pudo conectar con el servicio externo o base de datos.',
      statusCode: 503,
    };
  }

  // 6. Safe domain / business logic error messages
  if (error instanceof Error && isSafeMessage(rawMessage)) {
    return {
      message: rawMessage,
      statusCode: 400,
    };
  }

  // 7. General fallback
  return {
    message: fallbackMessage || 'Ocurrió un error inesperado al procesar la solicitud.',
    statusCode: 500,
  };
}

/**
 * Controller-level helper to log technical error details and send a standardized, sanitized client response.
 */
export function handleControllerError(
  error: unknown,
  reply: FastifyReply,
  fallbackMessage?: string
): FastifyReply {
  const { message, statusCode } = sanitizeApiError(error, fallbackMessage);

  // Log full error details to server console for debugging
  const logDetails = error instanceof Error
    ? {
        name: error.name,
        message: error.message,
        code: (error as any)?.code || (error as any)?.cause?.code,
        detail: (error as any)?.detail || (error as any)?.cause?.detail,
        stack: error.stack,
      }
    : error;

  console.error(`[API Error ${statusCode}]:`, logDetails);

  return reply.code(statusCode).send({ message });
}
