import {Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {type Path} from 'sanity'

import {TreeEditingLayout} from '../components'
import {type TreeEditingBreadcrumb, type TreeEditingMenuItem} from '../types'

const ITEMS: TreeEditingMenuItem[] = []

const EMPTY_ARRAY: [] = []

// todo: update this story so that it is fully functional and interactive using
// a mock schema and a mock document value with the `buildTreeEditingState` function.
export default function TreeEditingLayoutStory(): JSX.Element {
  const [breadcrumbs, setBreadcrumbs] = useState<TreeEditingBreadcrumb[]>(EMPTY_ARRAY)
  const [selectedPath, setSelectedPath] = useState<Path>(EMPTY_ARRAY)

  const handlePathSelect = useCallback((path: Path) => {
    // const next: TreeEditingBreadcrumb[] =
    //   path?.map((segment) => ({title: segment.toString(), path: [] as Path, children: []})) || []

    // setBreadcrumbs(next)
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
