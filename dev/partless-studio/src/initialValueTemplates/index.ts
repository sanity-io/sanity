import {InitialValueTemplatesResolver} from '@sanity/base'

export const resolveInitialValueTemplates: InitialValueTemplatesResolver = (T, {schema}) => {
  return [
    ...T.defaults(schema),

    T.template({
      id: 'author-developer',
      title: 'Developer',
      description: `Selects the role "Developer" for you, so you don't have to`,
      schemaType: 'author',
      value: () => ({role: 'developer'}),
    }),

    T.template({
      id: 'author-unlocked',
      title: 'Author unlocked',
      description: 'An unlocked author',
      schemaType: 'author',
      value: {locked: false},
    }),

    T.template<{authorId?: string}, {author: {_type: 'reference'; _ref?: string}}>({
      id: 'book-by-author',
      title: 'Book by author',
      description: 'Book by a specific author',
      schemaType: 'book',
      parameters: [{name: 'authorId', type: 'string'}],
      value: (params) => ({
        author: {_type: 'reference', _ref: params?.authorId},
      }),
    }),
  ]
}
