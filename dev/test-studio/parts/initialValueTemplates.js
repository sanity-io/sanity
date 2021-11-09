import T from '@sanity/base/initial-value-template-builder'

export default [
  ...T.defaults(),

  T.template({
    id: 'author-developer',
    title: 'Developer',
    description: `Selects the role "Developer" for you, so you don't have to`,
    schemaType: 'author',
    value: (params) => ({role: 'developer'}),
  }),

  T.template({
    id: 'book-by-author',
    title: 'Book by author',
    description: 'Book by a specific author',
    schemaType: 'book',
    parameters: [{name: 'authorId', type: 'string'}],
    value: (params) => ({
      author: {_type: 'reference', _ref: params.authorId},
    }),
  }),
]
