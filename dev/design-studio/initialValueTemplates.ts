import _T from '@sanity/initial-value-templates/src'
import {Schema} from '@sanity/types'

export function initialValueTemplates(T: typeof _T, {schema}: {schema: Schema}) {
  return [
    ...T.defaults(schema),

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
}
