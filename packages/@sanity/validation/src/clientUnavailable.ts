export class ClientUnavailableError extends Error {
  override name = 'ClientUnavailableError'

  constructor() {
    super('A Sanity client is required to run this validation check')
  }
}
