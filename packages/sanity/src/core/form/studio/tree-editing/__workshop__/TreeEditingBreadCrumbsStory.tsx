import {Container, Flex} from '@sanity/ui'

import {TreeEditingBreadCrumbs} from '../components'
import {type TreeEditingBreadcrumb} from '../types'

function noop() {
  return null
}

const ITEMS: TreeEditingBreadcrumb[] = [
  {
    title: 'First',
    path: ['first'],
  },
  {
    title: 'Second',
    path: ['first', 'second'],
  },
  {
    title: 'Third',
    path: ['first', 'second', 'third'],
  },
  {
    title: 'Fourth',
    path: ['first', 'second', 'third', 'fourth'],
  },
  {
    title: 'Fifth',
    path: ['first', 'second', 'third', 'fourth', 'fifth'],
  },
  {
    title: 'Sixth',
    path: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
  },
]

export default function TreeEditingBreadCrumbsStory(): JSX.Element {
  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <TreeEditingBreadCrumbs items={ITEMS} onPathSelect={noop} />
      </Container>
    </Flex>
  )
}
