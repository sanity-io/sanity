import {type Template} from 'sanity'

export const templates: Template[] = [
  {
    id: 'author-developer',
    title: 'Developer',
    schemaType: 'author',
    value: {
      role: 'developer',
    },
  },
  {
    id: 'author-designer',
    title: 'Designer',
    schemaType: 'author',
    value: {
      role: 'designer',
    },
  },
  {
    id: 'author-manager',
    title: 'Manager',
    schemaType: 'author',
    value: {
      role: 'manager',
    },
  },
]
