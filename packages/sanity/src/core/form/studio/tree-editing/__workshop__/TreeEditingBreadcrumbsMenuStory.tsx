import {Container, Flex} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingBreadcrumbsMenu} from '../components'
import {type TreeEditingBreadcrumb} from '../types'

const items: TreeEditingBreadcrumb[] = [
  {
    title: 'First item',
    path: ['first-item'],
    children: [],
  },
  {
    title: 'Second item',
    path: ['second-item'],
    children: [],
  },
  {
    title: 'Third item',
    path: ['third-item'],
    children: [],
  },
]

export default function TreeEditingBreadcrumbsMenuStory(): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['second-item'])

  return (
    <Flex align="center" height="fill">
      <Container width={0}>
        <TreeEditingBreadcrumbsMenu
          items={items}
          onPathSelect={setSelectedPath}
          selectedPath={selectedPath}
          textInputElement={null}
        />
      </Container>
    </Flex>
  )
}
