import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MODEL_API_KEY, MODEL_API_URL } from '../../../config/env.js';
import { FinanceForecastUnavailable } from '../exceptions/exceptions.js';

export interface ModelTransaction {
  property_id: string;
  type: string;
  category: string;
  status: string;
  amount: string;
  currency: string;
  occurred_at: string;
}

//cliente HTTP de la API Python del modelo (RENT-BACKEND/modelo)
@Injectable()
export class ModelClient {
  private readonly logger = new Logger(ModelClient.name);

  async forecast(
    transactions: ModelTransaction[],
    horizon: number,
  ): Promise<unknown> {
    try {
      const { data } = await axios.post<unknown>(
        `${MODEL_API_URL}/forecast`,
        { transactions, horizon },
        {
          timeout: 15000,
          headers: MODEL_API_KEY ? { 'X-Api-Key': MODEL_API_KEY } : {},
        },
      );
      return data;
    } catch (error) {
      this.logger.error(
        `Fallo la API del modelo: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new FinanceForecastUnavailable();
    }
  }
}
