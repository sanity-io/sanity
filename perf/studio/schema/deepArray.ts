export const deepArray = {
  type: 'document',
  name: 'deepArray',
  fields: [
    {
      name: 'text',
      type: 'string',
    },
    {
      name: 'deep',
      type: 'array',
      of: [{type: 'deepArray'}],
    },
  ],
}
