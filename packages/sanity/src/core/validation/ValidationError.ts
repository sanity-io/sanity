import {
  type Path,
  type ValidationError as IValidationError,
  type ValidationErrorClass,
  type ValidationErrorOptions,
  type ValidationMarker,
} from '@sanity/types'

/**
 * @deprecated You can pass a plain object that adheres to the `ValidationError`
 * interface instead of using this.
 */
// Follows the same pattern as Rule and RuleClass. @see Rule
export const ValidationError: ValidationErrorClass = class ValidationError
  implements IValidationError
{
  message: string
  paths: Path[]
  children: ValidationMarker[] | undefined
  operation: 'AND' | 'OR' | undefined

  constructor(message: string, options: ValidationErrorOptions = {}) {
    this.message = message
    this.paths = options.paths || []
    this.children = options.children
    this.operation = options.operation
  }

  cloneWithMessage(msg: string): ValidationError {
    return new ValidationError(msg, {
      paths: this.paths,
      children: this.children,
      operation: this.operation,
    })
  }
}
