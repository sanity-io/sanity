export interface CorsOriginErrorOptions {
  projectId?: string
}

export class CorsOriginError extends Error {
  projectId?: string

  constructor({projectId}: CorsOriginErrorOptions) {
    super('CorsOriginError')
    this.projectId = projectId
  }
}
