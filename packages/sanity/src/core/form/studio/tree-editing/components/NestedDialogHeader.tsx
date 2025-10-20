import {type Path} from '@sanity/types'
import {Flex} from '@sanity/ui'

import {type TreeEditingState} from '../utils'
import {TreeEditingBreadcrumbs} from './breadcrumbs/TreeEditingBreadcrumbs'

interface NestedDialogHeaderProps {
  treeState: TreeEditingState
  onHandlePathSelect: (path: Path) => void
}

export function NestedDialogHeader(props: NestedDialogHeaderProps) {
  const {treeState, onHandlePathSelect} = props
  const {relativePath, siblings} = treeState

  return (
    <Flex align="center" gap={2} justify="space-between">
      <TreeEditingBreadcrumbs
        items={treeState.breadcrumbs}
        onPathSelect={onHandlePathSelect}
        selectedPath={relativePath}
        siblings={siblings}
      />
    </Flex>
  )
}
