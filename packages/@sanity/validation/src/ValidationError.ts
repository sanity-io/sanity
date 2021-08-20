import {
  Path,
  ValidationMarker,
  ValidationError as IValidationError,
  ValidationErrorOptions,
  ValidationErrorClass,
} from '@sanity/types'
import ExtendableError from 'es6-error'

// Follows the same pattern as Rule and RuleClass. @see Rule
const ValidationError: ValidationErrorClass = class ValidationError
  extends ExtendableError
  implements IValidationError {
  paths: Path[]
  children: ValidationMarker[] | undefined
  operation: 'AND' | 'OR' | undefined

  constructor(message: string, options: ValidationErrorOptions = {}) {
    super(message)
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

export default ValidationError
