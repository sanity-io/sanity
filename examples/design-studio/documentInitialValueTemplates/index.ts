import T from '@sanity/base/initial-value-template-builder'

export default [
  ...T.defaults(),

  T.template({
    id: 'author-developer',
    title: 'Developer',
    schemaType: 'author',
    value: {
      role: 'developer',
    },
  }),

  T.template({
    id: 'author-designer',
    title: 'Designer',
    schemaType: 'author',
    value: {
      role: 'designer',
    },
  }),

  T.template({
    id: 'author-manager',
    title: 'Manager',
    schemaType: 'author',
    value: {
      role: 'manager',
    },
  }),
]
