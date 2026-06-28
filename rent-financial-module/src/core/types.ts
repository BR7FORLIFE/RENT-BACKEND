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
