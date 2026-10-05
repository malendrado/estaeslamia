import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';
import { ServiceRequest } from './entities/service-request.entity';
import { Category } from '../categories/entities/category.entity';
import { Service } from '../services/entities/service.entity';
import { Commune } from '../communes/entities/commune.entity';
import { UsersService } from '../users/users.service';
import { LeadsService } from '../leads/leads.service';
import { TurnstileService } from '../../common/services/turnstile.service';
import { ServiceRequestStatus } from '../../common/enums';

const CATEGORY_ID = 'cat-1';
const SERVICE_ID = 'srv-1';
const OTHER_CATEGORY_SERVICE_ID = 'srv-2';
const COMMUNE_ID = 'com-1';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;

  const serviceRequestRepoMock = {
    create: jest.fn((data) => data),
    save: jest.fn((entity) => Promise.resolve({ id: 'req-1', ...entity })),
  };
  const categoryRepoMock = {
    findOne: jest.fn(() => Promise.resolve({ id: CATEGORY_ID, name: 'Hogar' })),
  };
  const serviceRepoMock = {
    findOne: jest.fn(({ where }) => {
      if (where.id === SERVICE_ID) return Promise.resolve({ id: SERVICE_ID, categoryId: CATEGORY_ID, name: 'Gasfitería' });
      if (where.id === OTHER_CATEGORY_SERVICE_ID)
        return Promise.resolve({ id: OTHER_CATEGORY_SERVICE_ID, categoryId: 'other-cat', name: 'Mecánica' });
      return Promise.resolve(null);
    }),
  };
  const communeRepoMock = {
    findOne: jest.fn(() => Promise.resolve({ id: COMMUNE_ID, name: 'Quintero' })),
  };
  const usersServiceMock = {
    findOrCreateSilentCustomer: jest.fn(() => Promise.resolve({ id: 'user-1', email: 'test@example.cl' })),
  };
  const leadsServiceMock = {
    generateLeadsForServiceRequest: jest.fn(() => Promise.resolve([])),
    findByServiceRequestId: jest.fn(() => Promise.resolve([])),
  };
  const turnstileServiceMock = {
    verify: jest.fn(() => Promise.resolve()),
  };

  const baseDto = {
    categoryId: CATEGORY_ID,
    serviceId: SERVICE_ID,
    communeId: COMMUNE_ID,
    description: 'Necesito revisar una filtración en la cocina.',
    contactName: 'Juana Pérez',
    contactEmail: 'juana@example.cl',
    contactPhone: '+56911111111',
    consentAccepted: true,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        { provide: getRepositoryToken(ServiceRequest), useValue: serviceRequestRepoMock },
        { provide: getRepositoryToken(Category), useValue: categoryRepoMock },
        { provide: getRepositoryToken(Service), useValue: serviceRepoMock },
        { provide: getRepositoryToken(Commune), useValue: communeRepoMock },
        { provide: UsersService, useValue: usersServiceMock },
        { provide: LeadsService, useValue: leadsServiceMock },
        { provide: TurnstileService, useValue: turnstileServiceMock },
      ],
    }).compile();

    service = module.get(ServiceRequestsService);
  });

  it('rechaza la solicitud si no se acepta el consentimiento', async () => {
    await expect(service.create({ ...baseDto, consentAccepted: false })).rejects.toThrow(BadRequestException);
  });

  it('rechaza la solicitud si budgetMin > budgetMax', async () => {
    await expect(service.create({ ...baseDto, budgetMin: 900000, budgetMax: 600000 })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rechaza la solicitud si el servicio no pertenece a la categoría indicada', async () => {
    await expect(service.create({ ...baseDto, serviceId: OTHER_CATEGORY_SERVICE_ID })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('crea la solicitud en estado SUBMITTED cuando el matching no encuentra providers', async () => {
    leadsServiceMock.generateLeadsForServiceRequest.mockResolvedValueOnce([]);
    const result = await service.create(baseDto);
    expect(result.matchesCount).toBe(0);
    expect(result.serviceRequest.status).toBe(ServiceRequestStatus.SUBMITTED);
  });

  it('pasa la solicitud a MATCHED cuando el matching encuentra al menos un provider', async () => {
    leadsServiceMock.generateLeadsForServiceRequest.mockResolvedValueOnce([{ id: 'lead-1' } as any]);
    const result = await service.create(baseDto);
    expect(result.matchesCount).toBe(1);
    expect(result.serviceRequest.status).toBe(ServiceRequestStatus.MATCHED);
  });

  it('usa un customer "silencioso" (sin registro) al crear la solicitud', async () => {
    await service.create(baseDto);
    expect(usersServiceMock.findOrCreateSilentCustomer).toHaveBeenCalledWith({
      email: baseDto.contactEmail,
      name: baseDto.contactName,
      phone: baseDto.contactPhone,
    });
  });
});
