export const simpleReferences = {
  name: 'simpleReferences',
  type: 'document',
  title: 'Simple references test',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'image',
      title: 'Title',
      type: 'image',
    },
    {
      name: 'referenceField',
      title: 'Reference field',
      description: 'A simple reference field',
      type: 'reference',
      to: [{type: 'simpleReferences'}],
    },
  ],
}
