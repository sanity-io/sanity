import {isKeySegment, type Path} from '@sanity/types'
import {Flex, Text} from '@sanity/ui'

import {pathToString} from '../../../../field/paths/helpers'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {type TreeEditingMenuItem} from '../types'
import {type TreeEditingState} from '../utils'
import {TreeEditingBreadcrumbs} from './breadcrumbs/TreeEditingBreadcrumbs'

interface NestedDialogHeaderProps {
  treeState: TreeEditingState
  onHandlePathSelect: (path: Path) => void
}

export function NestedDialogHeader(props: NestedDialogHeaderProps) {
  const {treeState, onHandlePathSelect} = props
  const {relativePath, menuItems} = treeState
  const {t} = useTranslation()

  function getSiblingList(currentItemList: TreeEditingMenuItem[]): TreeEditingMenuItem[] {
    // Check if any item in the current list matches the relativePath
    for (const item of currentItemList) {
      if (pathToString(item.path) === pathToString(relativePath)) {
        // Found the item - filter siblings to only include items at the same parent
        const sameLevelSiblings = currentItemList.filter((sibling) => {
          return isKeySegment(sibling.path[sibling.path.length - 1])
            ? sibling.path[sibling.path.length - 2] === relativePath[relativePath.length - 2]
            : sibling.path[sibling.path.length - 1] === relativePath[relativePath.length - 1]
        })
        return sameLevelSiblings
      }
    }

    // If not found at this level, search in children recursively
    for (const item of currentItemList) {
      if (item.children && item.children.length > 0) {
        const found = getSiblingList(item.children)
        if (found.length > 0) return found
      }
    }

    // Not found - return empty array
    return []
  }

  const siblingList = getSiblingList(menuItems)

  const total = siblingList.length
  const currentIndex =
    siblingList &&
    siblingList.findIndex((item) => pathToString(item.path) === pathToString(relativePath)) + 1

  return (
    <Flex align="center" gap={2} justify="space-between">
      <TreeEditingBreadcrumbs
        items={treeState.breadcrumbs}
        onPathSelect={onHandlePathSelect}
        selectedPath={treeState.relativePath}
      />
      {total >= 1 && (
        <Text>
          {t('nested-object-editing-dialog.header.sibling-count', {
            count: currentIndex,
            total,
          })}
        </Text>
      )}
    </Flex>
  )
}
