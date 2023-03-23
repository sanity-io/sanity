/**
 * Note: Perf test schemas are immutable - instead of modifying a schema, create a new one and suffix the name with a version number.
 */
export const deepArrayString = {
  type: 'document',
  name: 'deepArrayString',
  fields: [
    {
      name: 'text',
      type: 'string',
    },
    {
      name: 'deep',
      type: 'array',
      of: [{type: 'string'}],
    },
  ],
}
