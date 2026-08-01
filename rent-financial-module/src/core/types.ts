export interface Payload {
  userId: string;
  rols: string[];
}

export interface ErrorHttpResponse {
  localDatetime: string;
  error: string;
  message: string;
  path: string;
}

/**
 * LocalDateTime localDateTime,
        String error,
        String message,
        String path
 */

//estado de error del microservicio de auth
export interface ApiError {
  localDateTime: Date;
  error: string;
  message: string;
  path: string;
}
