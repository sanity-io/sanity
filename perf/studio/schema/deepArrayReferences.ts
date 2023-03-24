/**
 * Note: Perf test schemas are immutable - instead of modifying a schema, create a new one and suffix the name with a version number.
 */
export const deepArrayReferences = {
  type: 'document',
  name: 'deepArrayReference',
  fields: [
    {
      name: 'text',
      type: 'string',
    },
    {
      name: 'deep',
      type: 'array',
      of: [{type: 'reference', to: {type: 'deepArrayReference'}}],
    },
  ],
}
