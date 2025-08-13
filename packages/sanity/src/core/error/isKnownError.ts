import {isObject} from 'lodash'

import {ConfigResolutionError} from '../config/ConfigResolutionError'
import {SchemaError} from '../config/SchemaError'
import {CorsOriginError} from '../store/_legacy/cors/CorsOriginError'

export function isKnownError(err: unknown): boolean {
  if (err instanceof SchemaError) {
    return true
  }

  if (err instanceof CorsOriginError) {
    return true
  }

  if (err instanceof ConfigResolutionError) {
    return true
  }

  // This is a special case for the Vite dev server stopping error
  if (isObject(err) && 'ViteDevServerStoppedError' in err && err.ViteDevServerStoppedError) {
    return true
  }

  return false
}
