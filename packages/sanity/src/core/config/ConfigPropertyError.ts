import {isRecord} from '../util'

/** @internal */
export interface ConfigPropertyErrorOptions {
  propertyName: string
  path: string[]
  cause: unknown
}

/** @internal */
export class ConfigPropertyError extends Error {
  propertyName: string
  path: string[]
  cause: unknown

  constructor({propertyName, path, cause}: ConfigPropertyErrorOptions) {
    const message =
      isRecord(cause) && typeof cause?.message === 'string' ? `: ${cause.message}` : ''

    super(
      `An error occurred while resolving \`${propertyName}\` from ${path.join(' > ')}${message}`
    )

    this.propertyName = propertyName
    this.cause = cause
    this.path = path
  }
}
