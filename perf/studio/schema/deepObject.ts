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
    },
  ],
}
