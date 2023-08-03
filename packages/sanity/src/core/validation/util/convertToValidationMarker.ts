import type {ValidationMarker, ValidationError, ValidationContext} from '@sanity/types'
import {ValidationError as ValidationErrorClass} from '../ValidationError'
import {pathToString} from '../util/pathToString'

type ValidationErrorLike = Pick<ValidationError, 'message'> & Partial<ValidationError>

export function isNonNullable<T>(t: T): t is NonNullable<T> {
  return t !== null || t !== undefined
}

export function convertToValidationMarker(
  validatorResult:
    | true
    | true[]
    | string
    | string[]
    | ValidationError
    | ValidationError[]
    | ValidationErrorLike
    | ValidationErrorLike[],
  level: 'error' | 'warning' | 'info' | undefined,
  context: ValidationContext
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
    return convertToValidationMarker(new ValidationErrorClass(validatorResult), level, context)
  }

  if (!(validatorResult instanceof ValidationErrorClass)) {
    // in order to accept the `ValidationErrorLike`, it at least needs to have
    // a `message` in the object
    if (typeof validatorResult?.message !== 'string') {
      throw new Error(
        `${pathToString(
          context.path
        )}: Validator must return 'true' if valid or an error message as a string on errors`
      )
    }

    // this is the occurs when an object is returned that wasn't created with the
    // `ValidationErrorClass`. in this case, we want to convert it to a class
    return convertToValidationMarker(
      new ValidationErrorClass(validatorResult.message, validatorResult),
      level,
      context
    )
  }

  const results: ValidationMarker[] = []

  // the validator result does not include any item-level relative paths,
  // then just return the top-level path with the validation result
  if (!validatorResult.paths?.length) {
    return [
      {
        level: level || 'error',
        item: validatorResult,
        path: context.path || [],
      },
    ]
  }

  // if the validator result did include item-level relative paths, then for
  // each item-level relative path, create a validation marker that concatenates
  // the relative path with the path from the validation context
  return results.concat(
    validatorResult.paths.map((path) => ({
      path: (context.path || []).concat(path),
      level: level || 'error',
      item: validatorResult,
    }))
  )
}
