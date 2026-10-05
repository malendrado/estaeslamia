import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as dotenv from 'dotenv';

import { MatchingService } from '../src/modules/leads/matching.service';
import { Provider } from '../src/modules/providers/entities/provider.entity';
import { ProviderService as ProviderServiceEntity } from '../src/modules/providers/entities/provider-service.entity';
import { ProviderCommune } from '../src/modules/providers/entities/provider-commune.entity';
import { User } from '../src/modules/users/entities/user.entity';
import { Category } from '../src/modules/categories/entities/category.entity';
import { Service } from '../src/modules/services/entities/service.entity';
import { Region } from '../src/modules/regions/entities/region.entity';
import { Commune } from '../src/modules/communes/entities/commune.entity';
import { UserRole, ProviderStatus } from '../src/common/enums';

dotenv.config();

/**
 * Test de integración: requiere Postgres arriba con las migraciones ya aplicadas
 * (`npm run api:migration:run` desde la raíz del workspace). No usa mocks porque
 * el matching se resuelve con un JOIN en SQL (ver MatchingService); mockear el
 * QueryBuilder no probaría la lógica real de filtrado.
 *
 * Escenario (idéntico al definido en el brief del producto):
 *   Provider A: Gasfitería + Quintero, ACTIVE  -> debe matchear
 *   Provider B: Electricidad + Quintero, ACTIVE -> NO debe matchear (servicio distinto)
 *   Provider C: Gasfitería + Santiago, ACTIVE   -> NO debe matchear (comuna distinta)
 */
describe('MatchingService (integración)', () => {
  let moduleRef: TestingModule;
  let matchingService: MatchingService;

  let providerRepo: Repository<Provider>;
  let providerServiceRepo: Repository<ProviderServiceEntity>;
  let providerCommuneRepo: Repository<ProviderCommune>;
  let userRepo: Repository<User>;
  let categoryRepo: Repository<Category>;
  let serviceRepo: Repository<Service>;
  let regionRepo: Repository<Region>;
  let communeRepo: Repository<Commune>;

  let gasfiteriaId: string;
  let electricidadId: string;
  let quinteroId: string;
  let santiagoId: string;

  const createdUserIds: string[] = [];
  const createdProviderIds: string[] = [];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'estaeslamia',
          password: process.env.DB_PASSWORD || 'estaeslamia',
          database: process.env.DB_NAME || 'estaeslamia',
          entities: [Provider, ProviderServiceEntity, ProviderCommune, User, Category, Service, Region, Commune],
          synchronize: false,
        }),
        TypeOrmModule.forFeature([Provider, ProviderServiceEntity, ProviderCommune, User, Category, Service, Region, Commune]),
      ],
      providers: [MatchingService],
    }).compile();

    matchingService = moduleRef.get(MatchingService);
    providerRepo = moduleRef.get(getRepositoryToken(Provider));
    providerServiceRepo = moduleRef.get(getRepositoryToken(ProviderServiceEntity));
    providerCommuneRepo = moduleRef.get(getRepositoryToken(ProviderCommune));
    userRepo = moduleRef.get(getRepositoryToken(User));
    categoryRepo = moduleRef.get(getRepositoryToken(Category));
    serviceRepo = moduleRef.get(getRepositoryToken(Service));
    regionRepo = moduleRef.get(getRepositoryToken(Region));
    communeRepo = moduleRef.get(getRepositoryToken(Commune));

    // ---- Fixtures: catálogo mínimo (reutiliza si ya existe) ----
    let region = await regionRepo.findOne({ where: { code: 'TEST-REGION' } });
    if (!region) region = await regionRepo.save(regionRepo.create({ name: 'Región de Prueba', code: 'TEST-REGION' }));

    let quintero = await communeRepo.findOne({ where: { code: 'TEST-QUINTERO' } });
    if (!quintero) {
      quintero = await communeRepo.save(communeRepo.create({ name: 'Quintero (test)', code: 'TEST-QUINTERO', regionId: region.id }));
    }
    quinteroId = quintero.id;

    let santiago = await communeRepo.findOne({ where: { code: 'TEST-SANTIAGO' } });
    if (!santiago) {
      santiago = await communeRepo.save(communeRepo.create({ name: 'Santiago (test)', code: 'TEST-SANTIAGO', regionId: region.id }));
    }
    santiagoId = santiago.id;

    let category = await categoryRepo.findOne({ where: { slug: 'hogar-test' } });
    if (!category) category = await categoryRepo.save(categoryRepo.create({ name: 'Hogar (test)', slug: 'hogar-test' }));

    let gasfiteria = await serviceRepo.findOne({ where: { slug: 'gasfiteria-test' } });
    if (!gasfiteria) {
      gasfiteria = await serviceRepo.save(serviceRepo.create({ name: 'Gasfitería (test)', slug: 'gasfiteria-test', categoryId: category.id }));
    }
    gasfiteriaId = gasfiteria.id;

    let electricidad = await serviceRepo.findOne({ where: { slug: 'electricidad-test' } });
    if (!electricidad) {
      electricidad = await serviceRepo.save(serviceRepo.create({ name: 'Electricidad (test)', slug: 'electricidad-test', categoryId: category.id }));
    }
    electricidadId = electricidad.id;

    // ---- Providers A, B, C ----
    const makeProvider = async (
      label: string,
      serviceId: string,
      communeId: string,
      status: ProviderStatus,
    ): Promise<void> => {
      const email = `matching-test-${label.toLowerCase()}-${Date.now()}@example.cl`;
      const user = await userRepo.save(
        userRepo.create({ email, passwordHash: null, name: `Provider ${label}`, role: UserRole.PROVIDER, isActive: true }),
      );
      createdUserIds.push(user.id);

      const provider = await providerRepo.save(
        providerRepo.create({
          userId: user.id,
          businessName: `Empresa ${label} (test)`,
          phone: '+56900000000',
          email,
          status,
        }),
      );
      createdProviderIds.push(provider.id);

      await providerServiceRepo.save(providerServiceRepo.create({ providerId: provider.id, serviceId }));
      await providerCommuneRepo.save(providerCommuneRepo.create({ providerId: provider.id, communeId }));
    };

    await makeProvider('A', gasfiteriaId, quinteroId, ProviderStatus.ACTIVE);
    await makeProvider('B', electricidadId, quinteroId, ProviderStatus.ACTIVE);
    await makeProvider('C', gasfiteriaId, santiagoId, ProviderStatus.ACTIVE);
  }, 30000);

  afterAll(async () => {
    for (const providerId of createdProviderIds) {
      await providerServiceRepo.delete({ providerId });
      await providerCommuneRepo.delete({ providerId });
    }
    if (createdProviderIds.length) {
      await providerRepo.delete(createdProviderIds);
    }
    if (createdUserIds.length) {
      await userRepo.delete(createdUserIds);
    }
    await moduleRef.close();
  });

  it('matchea Provider A: mismo servicio y misma comuna', async () => {
    const results = await matchingService.findCompatibleProviders(gasfiteriaId, quinteroId);
    const businessNames = results.map((p) => p.businessName);
    expect(businessNames).toContain('Empresa A (test)');
  });

  it('NO matchea Provider B: servicio distinto (Electricidad) en la misma comuna', async () => {
    const results = await matchingService.findCompatibleProviders(gasfiteriaId, quinteroId);
    const businessNames = results.map((p) => p.businessName);
    expect(businessNames).not.toContain('Empresa B (test)');
  });

  it('NO matchea Provider C: mismo servicio pero comuna distinta (Santiago)', async () => {
    const results = await matchingService.findCompatibleProviders(gasfiteriaId, quinteroId);
    const businessNames = results.map((p) => p.businessName);
    expect(businessNames).not.toContain('Empresa C (test)');
  });

  it('no matchea providers con status distinto de ACTIVE', async () => {
    await providerRepo.update(createdProviderIds[0], { status: ProviderStatus.SUSPENDED });
    const results = await matchingService.findCompatibleProviders(gasfiteriaId, quinteroId);
    const businessNames = results.map((p) => p.businessName);
    expect(businessNames).not.toContain('Empresa A (test)');
    await providerRepo.update(createdProviderIds[0], { status: ProviderStatus.ACTIVE });
  });
});
