import {isNumberSchemaType, SchemaType} from '@sanity/types'

export function resolveNativeNumberInputValue(
  schemaType: SchemaType,
  value: unknown,
  localValue: string | undefined,
): string {
  if (
    isNumberSchemaType(schemaType) &&
    typeof localValue === 'string' &&
    Number(localValue) === value
  ) {
    return localValue
  }
  return String(value ?? '')
}
