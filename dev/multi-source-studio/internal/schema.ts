import {BookIcon, UserIcon} from '@sanity/icons'

export const schemaTypes = [
  {
    type: 'document',
    name: 'employee',
    title: 'Employee',
    icon: UserIcon,
    fields: [
      {
        type: 'string',
        name: 'name',
        title: 'Name',
      },
    ],
  },

  {
    type: 'document',
    name: 'guideline',
    title: 'Guideline',
    icon: BookIcon,
    fields: [
      {
        type: 'string',
        name: 'title',
        title: 'Title',
      },
    ],
  },
]
