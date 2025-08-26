import {type Template} from 'sanity'

export const resolveInitialValueTemplates: Template[] = [
  {
    id: 'author-developer',
    title: 'Developer',
    description: `Selects the role "Developer" for you, so you don't have to`,
    schemaType: 'author',
    value: () => ({role: 'developer'}),
  },
  {
    id: 'author-unlocked',
    title: 'Author unlocked',
    description: 'An unlocked author',
    schemaType: 'author',
    value: {locked: false, name: 'Unlocked author'},
  },
  {
    id: 'book-by-author',
    title: 'Book by author',
    description: 'Book by a specific author',
    schemaType: 'book',
    parameters: [{name: 'authorId', type: 'string'}],
    value: (params: any) => ({
      author: {_type: 'reference', _ref: params?.authorId},
    }),
  },
]
