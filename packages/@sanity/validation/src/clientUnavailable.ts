export class ClientUnavailableError extends Error {
  override name = 'ClientUnavailableError'
}

export function isClientUnavailableError(error: unknown): error is ClientUnavailableError {
  return error instanceof ClientUnavailableError
}
