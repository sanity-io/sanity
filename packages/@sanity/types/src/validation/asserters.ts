import type {FormNodeValidation} from './types'

/** @internal */
export function isValidationError(
  node: FormNodeValidation
): node is FormNodeValidation & {level: 'error'} {
  return node.level === 'error'
}

/** @internal */
export function isValidationWarning(
  node: FormNodeValidation
): node is FormNodeValidation & {level: 'warning'} {
  return node.level === 'warning'
}

/** @internal */
export function isValidationInfo(
  node: FormNodeValidation
): node is FormNodeValidation & {level: 'info'} {
  return node.level === 'info'
}
