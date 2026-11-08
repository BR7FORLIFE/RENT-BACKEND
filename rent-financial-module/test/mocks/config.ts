// Stub de src/config/config.ts: clientes externos (Gmail/axios) falsos.
export const gmailClient = { send: jest.fn() };
export const axiosMicroserviceClient = { get: jest.fn(), post: jest.fn() };
export const axiosRentAuth = { post: jest.fn() };
