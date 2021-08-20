import {ValidationMarker, ValidationError, ValidationContext} from '@sanity/types'
import ValidationErrorClass from '../ValidationError'
import pathToString from '../util/pathToString'

type ValidationErrorLike = Pick<ValidationError, 'message'> & Partial<ValidationError>

export function isNonNullable<T>(t: T): t is NonNullable<T> {
  return t !== null || t !== undefined
}

export default function convertToValidationMarker(
  validationResult:
    | true
    | true[]
    | string
    | string[]
    | ValidationError
    | ValidationError[]
    | ValidationErrorLike
    | ValidationErrorLike[],
  level: 'error' | 'warning' | undefined,
  context: ValidationContext
): ValidationMarker[] {
  if (validationResult === true) return []

  if (Array.isArray(validationResult)) {
    return validationResult
      .flatMap((child) => convertToValidationMarker(child, level, context))
      .filter(isNonNullable)
  }

  if (typeof validationResult === 'string') {
    return convertToValidationMarker(
      new ValidationErrorClass(validationResult, context.path && {paths: [context.path]}),
      level,
      context
    )
  }

  if (!(validationResult instanceof ValidationErrorClass)) {
    // in order to accept the `ValidationErrorLike`, it at least needs to have
    // a `message` in the object
    if (typeof validationResult?.message !== 'string') {
      throw new Error(
        `${pathToString(
          context.path
        )}: Validator must return 'true' if valid or an error message as a string on errors`
      )
    }

    // this is the occurs when an object is returned that wasn't created with the
    // `ValidationErrorClass`. in this case, we want to convert it to a class
    return convertToValidationMarker(
      new ValidationErrorClass(validationResult.message, validationResult),
      level,
      context
    )
  }

  const results: ValidationMarker[] = []

  // Add an item at "root" level (for arrays, the actual array)
  if (validationResult.paths.length === 0) {
    results.push({
      type: 'validation',
      level: level || 'error',
      item: validationResult,
      path: [],
    })
  }

  // Add individual items for each path
  return results.concat(
    validationResult.paths.map((path) => ({
      type: 'validation',
      path,
      level: level || 'error',
      item: validationResult,
    }))
  )
}
