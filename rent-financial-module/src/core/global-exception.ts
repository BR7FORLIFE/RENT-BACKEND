export abstract class AppException extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly error: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}
