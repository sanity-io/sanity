export const authorDocumentType = {
  type: 'document',
  name: 'author',
  title: 'Author',

  fields: [
    {
      type: 'string',
      name: 'name',
      title: 'Name',
    },

    {
      type: 'array',
      name: 'bio',
      title: 'Bio',
      of: [{type: 'block'}],
    },
  ],
}
