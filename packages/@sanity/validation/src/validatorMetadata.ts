import {type CustomValidator, type MediaValidator} from '@sanity/types'

type ValidationCallback = CustomValidator | MediaValidator

export function markValidator<T extends ValidationCallback>(
  validator: T,
  metadata: NonNullable<ValidationCallback['__sanityValidation']>,
): T {
  validator.__sanityValidation = metadata
  return validator
}
