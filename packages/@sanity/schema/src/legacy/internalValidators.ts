import {type CustomValidator, type MediaValidator} from '@sanity/types'

type ValidationCallback = CustomValidator | MediaValidator
const internalValidators = new WeakSet<object>()

/** @internal */
export function markInternalValidator<T extends ValidationCallback>(validator: T): T {
  internalValidators.add(validator)
  return validator
}

/** @internal */
export function isInternalValidator(validator: unknown): boolean {
  return typeof validator === 'function' && internalValidators.has(validator)
}
