import { Injectable } from '@nestjs/common';
import { axiosRentAuth } from '../../config/config.js';
import {
  RENT_AUTH_HOST,
  RENT_FINANCIAL_CLIENT_ID,
  RENT_FINANCIAL_CLIENT_SECRET,
} from '../../config/env.js';
import axios from 'axios';

export interface MicroserviceIdentificationData {
  clientId: string;
  clientSecret: string;
}

@Injectable()
export class MicroserviceAuthService {
  private token: string; // JWT

  async obtainToken() {
    if (this.token) {
      return this.token;
    }

    if (!RENT_FINANCIAL_CLIENT_ID || !RENT_FINANCIAL_CLIENT_SECRET) {
      throw new Error(
        'Se esperaba un CLIENT_ID  o un CLIENT_SECRET pero en cambio no se recibió',
      );
    }
    const body: MicroserviceIdentificationData = {
      clientId: RENT_FINANCIAL_CLIENT_ID,
      clientSecret: RENT_FINANCIAL_CLIENT_SECRET,
    };

    try {
      const { data } = await axiosRentAuth.post<{ jwt: string }>(
        `${RENT_AUTH_HOST}/microservice-identification`,
        body,
      );
      this.token = data.jwt;
      return data.jwt;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        //hacemos algo con el error para mejor auditoria
        throw new Error('Error al obtener el token de acceso', {
          cause: error,
        });
      }

      throw error;
    }
  }

  getToken() {
    if (this.token) {
      return this.token;
    }
    return this.obtainToken();
  }
}
