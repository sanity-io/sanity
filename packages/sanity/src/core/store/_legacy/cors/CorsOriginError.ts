/** @internal */
export interface CorsOriginErrorOptions {
  projectId?: string
}

/** @internal */
export class CorsOriginError extends Error {
  projectId?: string

  constructor({projectId}: CorsOriginErrorOptions) {
    super('CorsOriginError')
    this.name = 'CorsOriginError'
    this.projectId = projectId
  }
}
