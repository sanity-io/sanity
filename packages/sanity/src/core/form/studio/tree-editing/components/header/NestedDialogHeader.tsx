import {type Path} from '@sanity/types'
import {Flex} from '@sanity/ui'

import {type TreeEditingState} from '../../utils'
import {Breadcrumbs} from '../breadcrumbs/Breadcrumbs'

interface NestedDialogHeaderProps {
  treeState: TreeEditingState
  onHandlePathSelect: (path: Path) => void
}

export function NestedDialogHeader(props: NestedDialogHeaderProps) {
  const {treeState, onHandlePathSelect} = props
  const {relativePath, siblings} = treeState

  return (
    <Flex align="center" gap={2} justify="space-between">
      <Breadcrumbs
        items={treeState.breadcrumbs}
        onPathSelect={onHandlePathSelect}
        selectedPath={relativePath}
        siblings={siblings}
      />
    </Flex>
  )
}
