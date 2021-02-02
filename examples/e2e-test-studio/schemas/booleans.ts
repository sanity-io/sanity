export const booleansSchema = {
  type: 'document',
  name: 'booleans',
  title: 'Booleans',
  fields: [
    {
      type: 'string',
      name: 'title',
      title: 'Title',
    },
    {
      type: 'boolean',
      name: 'on',
      title: 'On',
    },
  ],
}
