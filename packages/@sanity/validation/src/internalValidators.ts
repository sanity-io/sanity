import {type CustomValidator, type MediaValidator} from '@sanity/types'

type ValidationCallback = CustomValidator | MediaValidator
const internalValidators = new WeakSet<object>()
const structuralValidators = new WeakSet<object>()

export function markInternalValidator<T extends ValidationCallback>(
  validator: T,
  options: {structural?: boolean} = {},
): T {
  internalValidators.add(validator)
  if (options.structural) structuralValidators.add(validator)
  return validator
}

export function isInternalValidator(validator: unknown): boolean {
  return typeof validator === 'function' && internalValidators.has(validator)
}

export function isStructuralValidator(validator: unknown): boolean {
  return typeof validator === 'function' && structuralValidators.has(validator)
}
