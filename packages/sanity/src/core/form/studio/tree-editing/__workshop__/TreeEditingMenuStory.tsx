import {Container} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingMenu} from '../components'
import {type TreeEditingMenuItem} from '../types'

const ITEMS: TreeEditingMenuItem[] = [
  {
    title: 'Level 1',
    path: ['level-1'],
    children: [
      {
        title: 'Level 1.1',
        path: ['level-1', 'level-1.1'],
      },
      {
        title: 'Level 1.2',
        path: ['level-1', 'level-1.2'],
      },
      {
        title: 'Level 1.3',
        path: ['level-1', 'level-1.3'],
      },
    ],
  },
  {
    title: 'Level 2',
    path: ['level-2'],
    children: [
      {
        title: 'Level 2.1',
        path: ['level-2', 'level-2.1'],
        children: [
          {
            title: 'Level 2.1.1',
            path: ['level-2', 'level-2.1', 'level-2.1.1'],
          },
          {
            title: 'Level 2.1.2',
            path: ['level-2', 'level-2.1', 'level-2.1.2'],
            children: [
              {
                title: 'Level 2.1.2.1',
                path: ['level-2', 'level-2.1', 'level-2.1.2', 'level-2.1.2.1'],
              },
              {
                title: 'Level 2.1.2.2',
                path: ['level-2', 'level-2.1', 'level-2.1.2', 'level-2.1.2.2'],
              },
            ],
          },
          {
            title: 'Level 2.1.3',
            path: ['level-2', 'level-2.1', 'level-2.1.3'],
          },
        ],
      },
    ],
  },
  {
    title: 'Level 3',
    path: ['level-3'],
  },
  {
    title: 'Level 4',
    path: ['level-4'],
    children: [
      {
        title: 'Level 4.1',
        path: ['level-4', 'level-4.1'],
      },
      {
        title: 'Level 4.2',
        path: ['level-4', 'level-4.2'],
      },
    ],
  },
]

export default function TreeEditingMenuStory() {
  const [selectedPath, setSelectedPath] = useState<Path | null>(null)

  return (
    <Container width={0} padding={3} sizing="border">
      <TreeEditingMenu items={ITEMS} onPathSelect={setSelectedPath} selectedPath={selectedPath} />
    </Container>
  )
}
