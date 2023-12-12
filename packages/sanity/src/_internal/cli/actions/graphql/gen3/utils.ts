/**
 * Generates a filter field name for a given field name.
 *
 * @internal
 *
 * @param fieldName - The field name to generate a filter field name for.
 * @param suffix - The suffix to append to the field name. Default is `Filter`.
 */
export function getFilterFieldName(fieldName: string, suffix = 'Filter'): string {
  return `${fieldName}${suffix}`
}
