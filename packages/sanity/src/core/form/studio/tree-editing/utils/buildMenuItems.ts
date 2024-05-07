import {type ObjectSchemaType} from 'sanity'

import {type TreeEditingMenuItem} from '../types'

export function buildTreeMenuItems(
  schemaType: ObjectSchemaType,
  documentValue: unknown,
): TreeEditingMenuItem[] {
  const arrays = Object.values(documentValue || {}).filter((item) => Array.isArray(item))

  return [
    {
      title: 'Root 1',
      path: [],
      children: [
        {
          title: 'Child 1',
          path: [],
        },
        {
          title: 'Child 2',
          path: [],

          children: [
            {
              title: 'Sub child 1',
              path: [],
            },
            {
              title: 'Sub child 2',
              path: [],
            },
          ],
        },
        {
          title: 'Child 3',
          path: [],
        },
      ],
    },
    {
      title: 'Root 2',
      path: [],

      children: [
        {
          title: 'Child 1',
          path: [],
        },
      ],
    },
  ]
}
