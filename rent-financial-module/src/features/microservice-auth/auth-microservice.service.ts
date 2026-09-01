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
  private token: string | null; // JWT
  private expirationTime: Date | null = null;

  async obtainToken() {
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
      const { data } = await axiosRentAuth.post<{
        jwt: string;
        expiredTimeSeconds: number;
      }>(`${RENT_AUTH_HOST}/rent-auth/microservice-identification`, body);

      this.token = data.jwt;
      this.verifyJwtExpiration(data.expiredTimeSeconds); //seteamos el expiration time

      return data.jwt;
    } catch (error) {
      this.token = null;
      if (axios.isAxiosError(error)) {
        //hacemos algo con el error para mejor auditoria
        throw new Error('Error al obtener el token de acceso', {
          cause: error,
        });
      }

      throw error;
    }
  }

  //este metodo nos permite darnos un margen de error ya que
  //pretendemos verificar si esta expirado el token 5 segundos antes de su expiracion
  //para evitar cualquier bug
  private verifyJwtExpiration(expiredTimeSeconds: number): void {
    const SECURE_MARGIN_SECONDS = 5;

    const expirationTimestamp =
      Date.now() + (expiredTimeSeconds - SECURE_MARGIN_SECONDS) * 1000;

    this.expirationTime = new Date(expirationTimestamp); //lo seteamos en la variable
  }

  //este metodo nos dira si el token esta expirado en este caso por el tiempo de expiracion
  //que nos da el microservicio de auth
  private isTokenExpired(): boolean {
    if (!this.expirationTime) {
      return true;
    }
    return Date.now() >= this.expirationTime.getTime();
  }

  async getToken(): Promise<string> {
    if (this.token && !this.isTokenExpired()) {
      return this.token;
    }

    return this.obtainToken();
  }
}
