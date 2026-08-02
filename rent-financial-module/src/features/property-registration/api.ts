import axios from 'axios';
import { axiosMicroserviceClient } from '../../config/config.js';
import { RENT_AUTH_HOST } from '../../config/env.js';
import type { ApiError } from '../../core/types.js';

interface UserData {
  userId: string;
  username: string;
  email: string;
  cellphone: string;
  fullname: string;
  isEnabled: boolean;
}
export async function getUserData(email: string): Promise<UserData> {
  try {
    const { data } = await axiosMicroserviceClient.get<UserData>(
      `${RENT_AUTH_HOST}/rent-auth/microservice-identification/user`,
      {
        params: {
          email,
        },
      },
    );

    return data;
  } catch (error) {
    if (axios.isAxiosError<ApiError>(error)) {
      //hacemos algo con el error para mejor auditoria
      const apiError = error.response?.data;
      throw new Error(apiError?.message, { cause: error });
    }
    throw error;
  }
}
