import type {NodeValidation} from './types'

export function isValidationError(node: NodeValidation): node is NodeValidation & {level: 'error'} {
  return node.level === 'error'
}

export function isValidationWarning(
  node: NodeValidation
): node is NodeValidation & {level: 'warning'} {
  return node.level === 'warning'
}

export function isValidationInfo(node: NodeValidation): node is NodeValidation & {level: 'info'} {
  return node.level === 'info'
}
