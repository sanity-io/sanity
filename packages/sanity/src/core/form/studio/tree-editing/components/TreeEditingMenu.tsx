import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import {Button, Stack} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
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
  onPathSelect: (path: Path | null) => void
  selectedPath: Path | null
}

function MenuItem(props: TreeEditingMenuItemProps) {
  const {item, onPathSelect, selectedPath} = props
  const {children, title} = item

  const [open, setOpen] = useState<boolean>(hasOpenChild(item, selectedPath))

  const handleClick = useCallback(() => {
    if (!children) {
      onPathSelect(item.path)
    }

    setOpen((v) => !v)
  }, [children, item.path, onPathSelect])

  const icon = useMemo(() => {
    if (!children) return null

    return open ? <ChevronUpIcon /> : <ChevronDownIcon />
  }, [children, open])

  return (
    <Stack key={title} space={1}>
      <Button
        fontSize={1}
        iconRight={icon}
        justify="space-between"
        mode="bleed"
        onClick={handleClick}
        padding={2}
        selected={selectedPath?.toString() === item.path.toString() && !children}
        text={title}
        width="fill"
      />

      {children && open && (
        <Stack paddingLeft={3} marginTop={1} space={1}>
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
  onPathSelect: (path: Path | null) => void
  selectedPath: Path | null
}

export function TreeEditingMenu(props: TreeEditingMenuProps) {
  const {items, onPathSelect, selectedPath} = props

  return (
    <Stack space={3}>
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
}
