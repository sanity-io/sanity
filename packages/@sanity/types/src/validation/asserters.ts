import type {NodeValidation} from './types'

/** @internal */
export function isValidationError(node: NodeValidation): node is NodeValidation & {level: 'error'} {
  return node.level === 'error'
}

/** @internal */
export function isValidationWarning(
  node: NodeValidation
): node is NodeValidation & {level: 'warning'} {
  return node.level === 'warning'
}

/** @internal */
export function isValidationInfo(node: NodeValidation): node is NodeValidation & {level: 'info'} {
  return node.level === 'info'
}
