import { Injectable } from '@nestjs/common';
import type { NotificationQueryParamsType } from './global.schema.js';
import type { GlobalRepository } from './repository-global.js';

@Injectable()
export class GlobalService {
  constructor(private readonly globalRepository: GlobalRepository) {}

  //notifications
  getAllNotifications(
    receiverId: string,
    filter: NotificationQueryParamsType,
  ) {}
}
