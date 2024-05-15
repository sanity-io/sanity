// eslint-disable-next-line no-restricted-imports
import {Button, Flex} from '@sanity/ui'
import {useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingBreadcrumbsMenuButton} from '../components'
import {type TreeEditingBreadcrumb} from '../types'

const ITEMS: TreeEditingBreadcrumb[] = [...Array(100).keys()].map((index) => ({
  title: `Item ${index}`,
  path: [`${index}-item`],
  children: [],
}))

export default function TreeEditingBreadcrumbsMenuButtonStory(): JSX.Element {
  const [selectedPath, setSelectedPath] = useState<Path>(['second-item'])

  return (
    <Flex align="center" justify="center" height="fill">
      <TreeEditingBreadcrumbsMenuButton
        items={ITEMS}
        onPathSelect={setSelectedPath}
        selectedPath={selectedPath}
        button={<Button text="Open menu" />}
      />
    </Flex>
  )
}
