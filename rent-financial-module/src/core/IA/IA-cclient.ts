import { Ollama } from 'ollama';
import { OLLAMA_HOST, OLLAMA_MODEL } from '../../config/env.js';

const OllamaClient = new Ollama({ host: OLLAMA_HOST });

//llamar el modelo en modo stream
export async function CallModelStream(prompt: string) {
  return await OllamaClient.chat({
    model: OLLAMA_MODEL,
    keep_alive: 0,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    options: {
      num_thread: 6,
      num_ctx: 1024,
    },
  });
}

//llamar el modelo y esperar la respuesta hasta que este generada
export function CallModel() {}
