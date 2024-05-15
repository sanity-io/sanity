import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import {Button, Stack} from '@sanity/ui'
import {isEqual} from 'lodash'
import {memo, useCallback, useMemo, useState} from 'react'
import {type Path} from 'sanity'

import {type TreeEditingMenuItem} from '../types'

function hasOpenChild(item: TreeEditingMenuItem, selectedPath: Path | null): boolean {
  return (
    item.children?.some(
      (child) =>
        child.path.toString() === selectedPath?.toString() || hasOpenChild(child, selectedPath),
    ) || false
  )
}

interface TreeEditingMenuItemProps {
  // ...
  item: TreeEditingMenuItem
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
}

function MenuItem(props: TreeEditingMenuItemProps) {
  const {item, onPathSelect, selectedPath} = props
  const {children, title} = item
  const hasChildren = children && children.length > 0
  const selected = isEqual(selectedPath, item.path)
  const [open, setOpen] = useState<boolean>(hasOpenChild(item, selectedPath))

  const handleClick = useCallback(() => {
    onPathSelect(item.path)

    setOpen((v) => !v)
  }, [item.path, onPathSelect])

  const icon = useMemo(() => {
    if (!hasChildren) return null

    return open ? <ChevronUpIcon /> : <ChevronDownIcon />
  }, [hasChildren, open])

  return (
    <Stack as="li" key={title} space={1}>
      <Button
        fontSize={1}
        iconRight={icon}
        justify="space-between"
        mode="bleed"
        onClick={handleClick}
        padding={2}
        selected={selected}
        text={item.title}
        width="fill"
      />

      {open && hasChildren && (
        <Stack as="ul" paddingLeft={3} marginTop={1} space={1}>
          {children.map((child) => (
            <MenuItem
              item={child}
              key={child.title}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

interface TreeEditingMenuProps {
  items: TreeEditingMenuItem[]
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
}

export const TreeEditingMenu = memo(function TreeEditingMenu(
  props: TreeEditingMenuProps,
): JSX.Element {
  const {items, onPathSelect, selectedPath} = props

  return (
    <Stack as="ul" space={3}>
      {items.map((item, index) => (
        <MenuItem
          item={item}
          key={`${item.path.toString()}-${index}`}
          onPathSelect={onPathSelect}
          selectedPath={selectedPath}
        />
      ))}
    </Stack>
  )
})
