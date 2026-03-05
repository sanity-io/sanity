/**
 * Note: Perf test schemas are immutable - instead of modifying a schema, create a new one and suffix the name with a version number.
 *
 */
export const arrayI18n = {
  type: 'document',
  name: 'arrayI18n',
  fields: [
    {
      name: 'simple',
      type: 'internationalizedArrayString',
    },
  ],
}
