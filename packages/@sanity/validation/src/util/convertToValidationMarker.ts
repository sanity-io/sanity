/* oxlint-disable typescript/no-deprecated -- marker compatibility requires legacy fields */
import {
  type Path,
  type ValidationError,
  type ValidationMarker,
  type ValidationSuggestedFix,
} from '@sanity/types'

import {type ValidationMarkerCode, validationMarkerCodes} from '../codes'
import {type ValidationContext} from '../types'
import {pathToString} from '../util/pathToString'

export function convertToValidationMarker(
  validatorResult: true | true[] | string | string[] | ValidationError | ValidationError[],
  level: 'error' | 'warning' | 'info' | undefined,
  context: ValidationContext,
  fallback: {code: ValidationMarkerCode; details?: Record<string, unknown>} = {
    code: validationMarkerCodes.validationFailed,
  },
): ValidationMarker[] {
  if (!context) {
    throw new Error('missing context')
  }

  if (validatorResult === true) return []

  if (Array.isArray(validatorResult)) {
    return validatorResult.flatMap((child) =>
      convertToValidationMarker(child, level, context, fallback),
    )
  }

  if (typeof validatorResult === 'string') {
    return convertToValidationMarker({message: validatorResult}, level, context, fallback)
  }

  if (typeof validatorResult.message !== 'string') {
    // in order to accept the `ValidationError`, it at least needs to have a
    // `message` in the object
    throw new Error(
      `${pathToString(
        context.path,
      )}: Validator must return 'true' if valid or an error message as a string on errors`,
    )
  }

  const {message, __internal_metadata} = validatorResult
  const code = validatorResult.code || fallback.code
  const details = validatorResult.details || fallback.details
  const suggestedFixes = validatorResult.suggestedFixes?.filter(isSuggestedFix)
  // A fix at the document root would replace the whole document, so fixes need a field path
  const fixesFor = (path: Path) =>
    suggestedFixes?.length && path.length > 0 ? {suggestedFixes} : undefined

  const normalizedPaths: Path[] = []
  if (validatorResult.path) {
    normalizedPaths.push(validatorResult.path)
  }

  // legacy support for `paths`
  for (const path of validatorResult.paths || []) {
    normalizedPaths.push(path)
  }

  // the validator result does not include any item-level relative paths,
  // then just return the top-level path with the validation result
  if (!normalizedPaths.length) {
    const path = context.path || []
    return [
      {
        code,
        ...(details && {details}),
        ...fixesFor(path),
        level: level || 'error',
        item: {message},
        message,
        path,
        __internal_metadata,
      },
    ]
  }

  // if the validator result did include item-level relative paths, then for
  // each item-level relative path, create a validation marker that concatenates
  // the relative path with the path from the validation context
  return normalizedPaths.map((relativePath) => {
    const path = (context.path || []).concat(relativePath)
    return {
      code,
      ...(details && {details}),
      ...fixesFor(path),
      path,
      level: level || 'error',
      item: {message},
      message,
      __internal_metadata,
    }
  })
}

function isSuggestedFix(fix: unknown): fix is ValidationSuggestedFix {
  if (typeof fix !== 'object' || fix === null) return false
  const {type, title} = fix as Record<string, unknown>
  if (typeof title !== 'string') return false
  return type === 'unset' || (type === 'set' && 'value' in fix)
}
