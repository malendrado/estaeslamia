import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService — activación/suspensión desde Admin', () => {
  let service: UsersService;

  const userRepoMock = {
    findOne: jest.fn(),
    save: jest.fn((user) => Promise.resolve(user)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [UsersService, { provide: getRepositoryToken(User), useValue: userRepoMock }],
    }).compile();
    service = module.get(UsersService);
  });

  it('suspende una cuenta activa con contraseña', async () => {
    userRepoMock.findOne.mockResolvedValue({ id: 'u1', isActive: true, passwordHash: 'hash' });
    const result = await service.setActiveStatus('u1', false);
    expect(result.isActive).toBe(false);
  });

  it('reactiva una cuenta suspendida que sí tiene contraseña', async () => {
    userRepoMock.findOne.mockResolvedValue({ id: 'u1', isActive: false, passwordHash: 'hash' });
    const result = await service.setActiveStatus('u1', true);
    expect(result.isActive).toBe(true);
  });

  it('NO permite activar una cuenta "silenciosa" sin contraseña (el dueño nunca se registró)', async () => {
    userRepoMock.findOne.mockResolvedValue({ id: 'u2', isActive: false, passwordHash: null });
    await expect(service.setActiveStatus('u2', true)).rejects.toThrow(BadRequestException);
    expect(userRepoMock.save).not.toHaveBeenCalled();
  });

  it('lanza NotFound si el usuario no existe', async () => {
    userRepoMock.findOne.mockResolvedValue(null);
    await expect(service.setActiveStatus('inexistente', false)).rejects.toThrow(NotFoundException);
  });
});
