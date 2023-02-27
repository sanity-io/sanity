/**
 * Note: Perf test schemas are immutable - instead of modifying a schema, create a new one and suffix the name with a version number.
 *
 */
export const simple = {
  type: 'document',
  name: 'simple',
  fields: [
    {
      name: 'simple',
      type: 'string',
    },
  ],
}
