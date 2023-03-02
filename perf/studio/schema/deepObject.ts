/**
 * Note: Perf test schemas are immutable - instead of modifying a schema, create a new one and suffix the name with a version number.
 *
 */
export const deepObject = {
  type: 'document',
  name: 'deepObject',
  fields: [
    {
      name: 'title',
      type: 'string',
    },
    {
      name: 'deep',
      type: 'deepObject',
      options: {
        collapsed: false,
      },
    },
  ],
}
