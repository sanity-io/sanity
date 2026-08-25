import {type CustomValidator, type MediaValidator} from '@sanity/types'

type ValidationCallback = CustomValidator | MediaValidator

export function markValidator<T extends ValidationCallback>(
  validator: T,
  kind: NonNullable<ValidationCallback['__sanityValidation']>,
): T {
  validator.__sanityValidation = kind
  return validator
}
