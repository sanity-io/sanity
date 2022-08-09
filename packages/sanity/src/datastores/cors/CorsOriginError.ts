export interface CorsOriginErrorOptions {
  isCorsError: boolean
  pingResponded: boolean
  projectId?: string
}

export class CorsOriginError extends Error {
  isCorsError: boolean
  pingResponded: boolean
  projectId?: string

  constructor({isCorsError, pingResponded, projectId}: CorsOriginErrorOptions) {
    super('CorsOriginError')

    this.isCorsError = isCorsError
    this.pingResponded = pingResponded
    this.projectId = projectId
  }
}
