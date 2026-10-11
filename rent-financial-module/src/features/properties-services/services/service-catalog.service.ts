import { Injectable } from '@nestjs/common';
import { ServiceCatalogRepository } from '../repository/service-catalog.repository.js';
import type {
  ChangeServiceStatusType,
  CreateServiceType,
  ListServicesQueryType,
  UpdateServiceType,
} from '../dtos/request-dto.js';
import {
  ServiceCatalogAdminRequired,
  ServiceCatalogNameTaken,
  ServiceCatalogNotFound,
} from '../exceptions/exceptions.js';
import { isServiceAdmin } from '../utils/catalog-admin.js';
import type { AuthUser } from '../../../types/global-types.js';

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly catalogRepository: ServiceCatalogRepository) {}

  private assertAdmin(user: AuthUser) {
    if (!isServiceAdmin(user.rols)) {
      throw new ServiceCatalogAdminRequired();
    }
  }

  // los no administradores solo ven categorias activas
  async findAll(user: AuthUser, query: ListServicesQueryType) {
    const isActive = isServiceAdmin(user.rols) ? query.isActive : true;
    return await this.catalogRepository.findAll({ ...query, isActive });
  }

  async findById(user: AuthUser, id: string) {
    const service = await this.catalogRepository.findById(id);
    if (!service || (!service.isActive && !isServiceAdmin(user.rols))) {
      throw new ServiceCatalogNotFound();
    }
    return service;
  }

  async create(user: AuthUser, dto: CreateServiceType) {
    this.assertAdmin(user);

    if (await this.catalogRepository.findByName(dto.name)) {
      throw new ServiceCatalogNameTaken();
    }
    return await this.catalogRepository.create(dto);
  }

  async update(user: AuthUser, id: string, dto: UpdateServiceType) {
    this.assertAdmin(user);

    const current = await this.catalogRepository.findById(id);
    if (!current) throw new ServiceCatalogNotFound();

    if (dto.name && dto.name.toLowerCase() !== current.name.toLowerCase()) {
      if (await this.catalogRepository.findByName(dto.name)) {
        throw new ServiceCatalogNameTaken();
      }
    }
    return await this.catalogRepository.update(id, dto);
  }

  // Activar/desactivar: nunca se elimina; las ofertas y solicitudes historicas se conservan
  async changeStatus(user: AuthUser, id: string, dto: ChangeServiceStatusType) {
    this.assertAdmin(user);

    if (!(await this.catalogRepository.findById(id))) {
      throw new ServiceCatalogNotFound();
    }
    return await this.catalogRepository.update(id, { isActive: dto.isActive });
  }
}
