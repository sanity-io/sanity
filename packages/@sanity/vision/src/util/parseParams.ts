import {type TFunction} from 'sanity/i18n'

import {type visionLocaleNamespace} from '../i18n'
import {tryParseParams} from './tryParseParams'

export interface Params {
  raw: string
  parsed: Record<string, unknown> | undefined
  valid: boolean
  error: string | undefined
}

export function parseParams(value: string, t: TFunction<typeof visionLocaleNamespace>): Params {
  const parsedParams = tryParseParams(value, t)
  const params = parsedParams instanceof Error ? {} : parsedParams
  const validationError = parsedParams instanceof Error ? parsedParams.message : undefined
  const isValid = !validationError

  return {
    parsed: params,
    raw: value,
    valid: isValid,
    error: validationError,
  }
}
