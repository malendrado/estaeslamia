import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TurnstileService } from './turnstile.service';

function buildService(secretKey: string | null): TurnstileService {
  const config = {
    get: jest.fn((key: string) => (key === 'turnstile.secretKey' ? secretKey : undefined)),
  } as unknown as ConfigService;
  return new TurnstileService(config);
}

describe('TurnstileService', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('omite la verificación (sin llamar a Cloudflare) cuando no hay secret configurado — modo desarrollo', async () => {
    const service = buildService(null);
    await expect(service.verify(undefined)).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rechaza si hay secret configurado pero el cliente no envió token', async () => {
    const service = buildService('secret');
    await expect(service.verify(undefined)).rejects.toThrow(BadRequestException);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('acepta un token que Cloudflare valida como correcto', async () => {
    fetchSpy.mockResolvedValue({ json: () => Promise.resolve({ success: true }) } as Response);
    const service = buildService('secret');
    await expect(service.verify('token-valido', '1.2.3.4')).resolves.toBeUndefined();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rechaza un token que Cloudflare marca como inválido', async () => {
    fetchSpy.mockResolvedValue({
      json: () => Promise.resolve({ success: false, 'error-codes': ['invalid-input-response'] }),
    } as Response);
    const service = buildService('secret');
    await expect(service.verify('token-falso')).rejects.toThrow(BadRequestException);
  });

  it('rechaza (en vez de dejar pasar) si falla la llamada de red a Cloudflare', async () => {
    fetchSpy.mockRejectedValue(new Error('network down'));
    const service = buildService('secret');
    await expect(service.verify('cualquier-token')).rejects.toThrow(BadRequestException);
  });
});
