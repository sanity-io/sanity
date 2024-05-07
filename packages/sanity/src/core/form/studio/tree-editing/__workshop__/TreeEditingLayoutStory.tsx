import {Text} from '@sanity/ui'

import {TreeEditingLayout} from '../components'
import {type TreeEditingMenuItem} from '../types'

const ITEMS: TreeEditingMenuItem[] = [
  {
    title: 'Level 1',
    path: ['level1'],
    children: [
      {
        title: 'Level 1.1',
        path: ['level1', 'level11'],
      },
      {
        title: 'Level 1.2',
        path: ['level1', 'level12'],
      },
    ],
  },
  {
    title: 'Level 2',
    path: ['level2'],
  },
  {
    title: 'Level 3',
    path: ['level3'],
    children: [
      {
        title: 'Level 3.1',
        path: ['level3', 'level31'],
        children: [
          {
            title: 'Level 3.1.1',
            path: ['level3', 'level31', 'level311'],
          },
          {
            title: 'Level 3.1.2',
            path: ['level3', 'level31', 'level312'],
          },
        ],
      },
      {
        title: 'Level 3.2',
        path: ['level3', 'level32'],
      },
    ],
  },
]

export default function TreeEditingLayoutStory() {
  return (
    <TreeEditingLayout items={ITEMS}>
      <Text>{`(form view)`}</Text>
    </TreeEditingLayout>
  )
}
