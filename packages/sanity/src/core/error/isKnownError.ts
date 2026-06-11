import isObject from 'lodash-es/isObject.js'

import {ConfigResolutionError, SchemaError} from '../config'

export function isKnownError(err: unknown): boolean {
  if (err instanceof SchemaError) {
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
