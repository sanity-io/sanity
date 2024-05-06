import {type ObjectSchemaType} from 'sanity'

import {type TreeEditingMenuItem} from '../types'

export function buildTreeMenuItems(
  schemaType: ObjectSchemaType,
  value: unknown,
): TreeEditingMenuItem[] {
  const arrays = Object.values(value || {}).filter((item) => Array.isArray(item))

  return [
    {
      title: 'Root 1',
      path: [],
      selected: false,
      children: [
        {
          title: 'Child 1',
          path: [],
          selected: false,
        },
        {
          title: 'Child 2',
          path: [],
          selected: false,
          children: [
            {
              title: 'Sub child 1',
              path: [],
              selected: false,
            },
            {
              title: 'Sub child 2',
              path: [],
              selected: false,
            },
          ],
        },
        {
          title: 'Child 3',
          path: [],
          selected: true,
        },
      ],
    },
    {
      title: 'Root 2',
      path: [],
      selected: false,
      children: [
        {
          title: 'Child 1',
          path: [],
          selected: false,
        },
      ],
    },
  ]
}
