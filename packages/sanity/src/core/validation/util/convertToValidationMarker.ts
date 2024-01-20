import {type Path, type ValidationError, type ValidationMarker} from '@sanity/types'

import {type ValidationContext} from '../types'
import {pathToString} from '../util/pathToString'

export function isNonNullable<T>(t: T): t is NonNullable<T> {
  return t !== null || t !== undefined
}

export function convertToValidationMarker(
  validatorResult: true | true[] | string | string[] | ValidationError | ValidationError[],
  level: 'error' | 'warning' | 'info' | undefined,
  context: ValidationContext,
): ValidationMarker[] {
  if (!context) {
    throw new Error('missing context')
  }

  if (validatorResult === true) return []

  if (Array.isArray(validatorResult)) {
    return validatorResult
      .flatMap((child) => convertToValidationMarker(child, level, context))
      .filter(isNonNullable)
  }

  if (typeof validatorResult === 'string') {
    return convertToValidationMarker({message: validatorResult}, level, context)
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

  const {message} = validatorResult

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
    return [
      {
        level: level || 'error',
        item: {message},
        message,
        path: context.path || [],
      },
    ]
  }

  // if the validator result did include item-level relative paths, then for
  // each item-level relative path, create a validation marker that concatenates
  // the relative path with the path from the validation context
  return normalizedPaths.map((path) => ({
    path: (context.path || []).concat(path),
    level: level || 'error',
    item: {message},
    message,
  }))
}
