/** @internal */
export interface CorsOriginErrorOptions {
  projectId?: string
  isStaging: boolean
}

/** @internal */
export class CorsOriginError extends Error {
  projectId?: string
  isStaging: boolean

  constructor({projectId, isStaging}: CorsOriginErrorOptions) {
    super('CorsOriginError')
    this.name = 'CorsOriginError'
    this.projectId = projectId
    this.isStaging = isStaging
  }
}
