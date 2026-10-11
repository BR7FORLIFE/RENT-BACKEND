// Stub de src/config/config.ts: clientes externos (Resend/axios) falsos.
export const resendClient = { emails: { send: jest.fn() } };
export const axiosMicroserviceClient = { get: jest.fn(), post: jest.fn() };
export const axiosRentAuth = { post: jest.fn() };
