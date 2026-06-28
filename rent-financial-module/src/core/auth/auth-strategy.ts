import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PUBLIC_RSA_KEY } from '../../config/env.js';
import type { Payload } from '../types.js';

@Injectable()
export class JwtPassport extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      secretOrKey: PUBLIC_RSA_KEY,
      algorithms: ['RS256'],
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  validate(payload: Payload): Payload {
    return {
      userId: payload.userId,
      rols: payload.rols,
    };
  }
}
