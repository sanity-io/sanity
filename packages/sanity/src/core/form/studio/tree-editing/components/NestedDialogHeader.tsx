import {type Path} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'

import {pathToString} from '../../../../field/paths/helpers'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type TreeEditingState} from '../utils'
import {TreeEditingBreadcrumbs} from './breadcrumbs/TreeEditingBreadcrumbs'

interface NestedDialogHeaderProps {
  treeState: TreeEditingState
  onHandlePathSelect: (path: Path) => void
}

export function NestedDialogHeader(props: NestedDialogHeaderProps) {
  const {treeState, onHandlePathSelect} = props
  const {relativePath, siblings} = treeState
  const {t} = useTranslation()

  const parentPath = relativePath.slice(0, -1)
  const parentPathString = pathToString(parentPath)

  const siblingInfo = siblings.get(parentPathString)
  const total = siblingInfo?.count
  const currentIndex = siblingInfo?.index

  return (
    <Flex align="center" gap={2} justify="space-between">
      <TreeEditingBreadcrumbs
        items={treeState.breadcrumbs}
        onPathSelect={onHandlePathSelect}
        selectedPath={treeState.relativePath}
      />
      {total && total >= 1 && (
        <Text style={{whiteSpace: 'nowrap'}}>
          {t('nested-object-editing-dialog.header.sibling-count', {
            count: currentIndex,
            total,
          })}
        </Text>
      )}
    </Flex>
  )
}
