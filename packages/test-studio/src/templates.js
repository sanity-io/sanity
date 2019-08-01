import T from '@sanity/base/initial-values-template-builder'

export default [
  ...T.defaults(),

  T.template({
    id: 'author-developer',
    title: 'Developer',
    description: `Selects the role "Developer" for you, so you don't have to`,
    schemaType: 'author',
    value: {
      role: 'developer'
    }
  })
]
