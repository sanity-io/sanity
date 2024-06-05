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
    parentArrayTitle: 'Array',
  },
  {
    title: 'Second',
    path: ['first', 'second'],
    children: [],
    parentArrayTitle: 'Array',
  },
  {
    title: 'Third',
    path: ['first', 'second', 'third'],
    children: [],
    parentArrayTitle: 'Array',
  },
  {
    title: 'Fourth',
    path: ['first', 'second', 'third', 'fourth'],
    children: [],
    parentArrayTitle: 'Array',
  },
  {
    title: 'Fifth',
    path: ['first', 'second', 'third', 'fourth', 'fifth'],
    children: [],
    parentArrayTitle: 'Array',
  },
  {
    title: 'Sixth',
    path: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
    children: [],
    parentArrayTitle: 'Array',
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
