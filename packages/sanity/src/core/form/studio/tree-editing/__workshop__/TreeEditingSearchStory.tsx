import {Container, Flex} from '@sanity/ui'

import {TreeEditingSearch} from '../components'
import {type TreeEditingMenuItem} from '../types'

function noop() {
  // ...
}

const ITEMS: TreeEditingMenuItem[] = [
  {
    path: ['path-1'],
    title: 'Item 1',
  },
  {
    path: ['path-2'],
    title: 'Item 2',
    children: [
      {
        path: ['path-2', 'child-1'],
        title: 'Child 1',
        children: [
          {
            path: ['path-2', 'child-1', 'grandchild-1'],
            title: 'Grandchild 1',
          },
        ],
      },
    ],
  },
  {
    path: ['path-3'],
    title: 'Item 3',
  },
]

export default function TreeEditingSearchStory() {
  return (
    <Flex align="center" height="fill" justify="center">
      <Container width={0}>
        <TreeEditingSearch items={ITEMS} onPathSelect={noop} />
      </Container>
    </Flex>
  )
}
