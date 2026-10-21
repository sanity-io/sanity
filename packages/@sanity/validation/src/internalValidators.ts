import {type CustomValidator, type MediaValidator} from '@sanity/types'

type ValidationCallback = CustomValidator | MediaValidator

/**
 * `@sanity/schema` manifest serialization checks this symbol and drops the
 * rule. Schema cannot import this package. Built-in validators are re-applied
 * from the type name when the manifest is reconstructed, so serializing them
 * as `{flag: 'custom'}` would install a throwing placeholder.
 *
 * Keep the key in sync with `extractManifestSchemaTypes`.
 */
const INTERNAL_VALIDATOR: symbol = Symbol.for('@sanity/validation/internalValidator')

const internalValidators = new WeakSet<object>()

export function markInternalValidator<T extends ValidationCallback>(validator: T): T {
  internalValidators.add(validator)
  Object.defineProperty(validator, INTERNAL_VALIDATOR, {value: true})
  return validator
}

export function isInternalValidator(validator: unknown): boolean {
  return typeof validator === 'function' && internalValidators.has(validator)
}
