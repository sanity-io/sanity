import {type Path} from '@sanity/types'
import {Stack} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import {memo} from 'react'

import {type TreeEditingMenuItem as TreeEditingMenuItemType} from '../../types'
import {TreeEditingMenuItem} from './TreeEditingMenuItem'
import {getSiblingHasChildren} from './utils'

interface TreeEditingMenuProps {
  items: TreeEditingMenuItemType[]
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
}

export const TreeEditingMenu = memo(function TreeEditingMenu(
  props: TreeEditingMenuProps,
): React.JSX.Element {
  const {items, onPathSelect, selectedPath} = props

  return (
    <Stack as="ul" data-testid="tree-editing-menu" role="tree" space={2}>
      {items.map((item) => {
        const siblingHasChildren = getSiblingHasChildren(items)

        return (
          <TreeEditingMenuItem
            item={item}
            key={toString(item.path)}
            onPathSelect={onPathSelect}
            selectedPath={selectedPath}
            siblingHasChildren={siblingHasChildren}
          />
        )
      })}
    </Stack>
  )
})
