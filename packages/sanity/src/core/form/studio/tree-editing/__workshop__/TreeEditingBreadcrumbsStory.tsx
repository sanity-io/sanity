import {Container, Flex} from '@sanity/ui'

import {TreeEditingBreadcrumbs} from '../components'
import {type TreeEditingBreadcrumb} from '../types'

function noop() {
  return null
}

const ITEMS: TreeEditingBreadcrumb[] = [
  {
    title: 'First',
    path: ['first'],
    children: [],
  },
  {
    title: 'Second',
    path: ['first', 'second'],
    children: [],
  },
  {
    title: 'Third',
    path: ['first', 'second', 'third'],
    children: [],
  },
  {
    title: 'Fourth',
    path: ['first', 'second', 'third', 'fourth'],
    children: [],
  },
  {
    title: 'Fifth',
    path: ['first', 'second', 'third', 'fourth', 'fifth'],
    children: [],
  },
  {
    title: 'Sixth',
    path: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
    children: [],
  },
]

export default function TreeEditingBreadcrumbsStory(): JSX.Element {
  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <TreeEditingBreadcrumbs items={ITEMS} onPathSelect={noop} selectedPath={[]} />
      </Container>
    </Flex>
  )
}
