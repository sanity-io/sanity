import T from '@sanity/base/initial-value-template-builder'

export default [
  ...T.defaults(),

  T.template({
    id: 'author-developer',
    title: 'Developer',
    description: `Selects the role "Developer" for you, so you don't have to`,
    schemaType: 'author',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    value: (_params) => ({role: 'developer'}),
  }),

  T.template({
    id: 'author-unlocked',
    title: 'Author unlocked',
    description: 'An unlocked author',
    schemaType: 'author',
    value: {locked: false},
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
