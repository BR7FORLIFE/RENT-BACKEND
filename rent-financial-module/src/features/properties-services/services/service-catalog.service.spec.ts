import { ServiceCatalogService } from './service-catalog.service.js';
import {
  ServiceCatalogAdminRequired,
  ServiceCatalogNameTaken,
  ServiceCatalogNotFound,
} from '../exceptions/exceptions.js';

const USER = { userId: 'u1', rols: ['USER'] };
const ADMIN = { userId: 'a1', rols: ['ROLE_ADMIN'] };

describe('ServiceCatalogService', () => {
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };
  let service: ServiceCatalogService;

  beforeEach(() => {
    jest.resetAllMocks();
    service = new ServiceCatalogService(repo as never);
  });

  it('crear / actualizar / cambiar estado exigen administrador', async () => {
    await expect(
      service.create(USER, { name: 'Plomeria', description: 'x' }),
    ).rejects.toBeInstanceOf(ServiceCatalogAdminRequired);
    await expect(
      service.update(USER, 's1', { name: 'abc' }),
    ).rejects.toBeInstanceOf(ServiceCatalogAdminRequired);
    await expect(
      service.changeStatus(USER, 's1', { isActive: false }),
    ).rejects.toBeInstanceOf(ServiceCatalogAdminRequired);
    expect(repo.create).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('el administrador crea una categoria', async () => {
    repo.findByName.mockResolvedValue(null);
    repo.create.mockResolvedValue({ id: 's1' });
    await expect(
      service.create(ADMIN, { name: 'Plomeria', description: 'x' }),
    ).resolves.toEqual({ id: 's1' });
  });

  it('nombre duplicado => 409', async () => {
    repo.findByName.mockResolvedValue({ id: 'otro' });
    await expect(
      service.create(ADMIN, { name: 'Plomeria', description: 'x' }),
    ).rejects.toBeInstanceOf(ServiceCatalogNameTaken);
  });

  it('actualizar: 404 y duplicado solo si cambia el nombre', async () => {
    repo.findById.mockResolvedValueOnce(null);
    await expect(
      service.update(ADMIN, 's1', { description: 'n' }),
    ).rejects.toBeInstanceOf(ServiceCatalogNotFound);

    repo.findById.mockResolvedValue({ id: 's1', name: 'Plomeria' });
    await service.update(ADMIN, 's1', { name: 'PLOMERIA' });
    expect(repo.findByName).not.toHaveBeenCalled();

    repo.findByName.mockResolvedValue({ id: 'otro' });
    await expect(
      service.update(ADMIN, 's1', { name: 'Pintura' }),
    ).rejects.toBeInstanceOf(ServiceCatalogNameTaken);
  });

  it('desactivar solo cambia isActive (nunca elimina)', async () => {
    repo.findById.mockResolvedValue({ id: 's1' });
    await service.changeStatus(ADMIN, 's1', { isActive: false });
    expect(repo.update).toHaveBeenCalledWith('s1', { isActive: false });
  });

  it('los no administradores solo listan activos y no ven inactivos por id', async () => {
    await service.findAll(USER, { page: 1, limit: 10, isActive: false });
    expect(repo.findAll.mock.calls[0][0].isActive).toBe(true);
    await service.findAll(ADMIN, { page: 1, limit: 10, isActive: false });
    expect(repo.findAll.mock.calls[1][0].isActive).toBe(false);

    repo.findById.mockResolvedValue({ id: 's1', isActive: false });
    await expect(service.findById(USER, 's1')).rejects.toBeInstanceOf(
      ServiceCatalogNotFound,
    );
    await expect(service.findById(ADMIN, 's1')).resolves.toBeDefined();
  });
});
