import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

/**
 * Sube archivos a Supabase Storage vía su API REST — se mantiene el
 * SERVICE_ROLE_KEY solo en el backend (nunca se expone al frontend).
 * Sin SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY configurados, lanza un error
 * claro en vez de fallar en silencio o con un error genérico de red.
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);

  constructor(private readonly config: ConfigService) {}

  async uploadPublicFile(params: {
    buffer: Buffer;
    mimeType: string;
    extension: string;
    folder: string;
  }): Promise<string> {
    const url = this.config.get<string>('supabaseStorage.url');
    const serviceRoleKey = this.config.get<string>('supabaseStorage.serviceRoleKey');
    const bucket = this.config.get<string>('supabaseStorage.bucket');

    if (!url || !serviceRoleKey) {
      throw new BadRequestException(
        'La subida de archivos no está configurada en este ambiente (falta SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)',
      );
    }

    const fileName = `${params.folder}/${randomUUID()}.${params.extension}`;
    const uploadUrl = `${url}/storage/v1/object/${bucket}/${fileName}`;

    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          'Content-Type': params.mimeType,
          'x-upsert': 'true',
        },
        // Node's fetch acepta Buffer en runtime; el cast evita que los tipos de
        // fetch (lib.dom) y Buffer (@types/node) choquen según la versión instalada.
        body: params.buffer as unknown as BodyInit,
      });
    } catch (error) {
      this.logger.error('Error de red subiendo archivo a Supabase Storage', error as Error);
      throw new InternalServerErrorException('No pudimos subir el archivo. Intenta nuevamente.');
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      this.logger.error(`Supabase Storage respondió ${response.status}: ${errorBody}`);
      throw new InternalServerErrorException('No pudimos subir el archivo. Intenta nuevamente.');
    }

    return `${url}/storage/v1/object/public/${bucket}/${fileName}`;
  }
}
