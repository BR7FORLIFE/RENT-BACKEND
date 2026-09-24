import { Injectable } from '@nestjs/common';
import { GlobalRepository } from './repository-global.js';

@Injectable()
export class GlobalService {
  constructor(private readonly globalRepository: GlobalRepository) {}

  //notifications
}
