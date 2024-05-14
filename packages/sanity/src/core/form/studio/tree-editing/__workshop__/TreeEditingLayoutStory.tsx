import {Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingLayout} from '../components'
import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'

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

const EMPTY_ARRAY: [] = []

// todo: update this story so that it is fully functional and interactive using
// a mock schema and a mock document value with the `buildTreeEditingState` function.
export default function TreeEditingLayoutStory(): JSX.Element {
  const [breadcrumbs, setBreadcrumbs] = useState<TreeEditingBreadcrumb[]>(EMPTY_ARRAY)
  const [selectedPath, setSelectedPath] = useState<Path>(EMPTY_ARRAY)

  const handlePathSelect = useCallback((path: Path) => {
    const next = path?.map((segment) => ({title: segment.toString(), path: [] as Path})) || []

    setBreadcrumbs(next)
    setSelectedPath(path)
  }, [])

  return (
    <TreeEditingLayout
      breadcrumbs={breadcrumbs}
      items={ITEMS}
      onPathSelect={handlePathSelect}
      selectedPath={selectedPath}
      title="Title"
    >
      <Text>{`(form view)`}</Text>
    </TreeEditingLayout>
  )
}
