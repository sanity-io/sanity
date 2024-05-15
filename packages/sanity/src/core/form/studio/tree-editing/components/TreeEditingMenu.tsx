import {ChevronDownIcon, ChevronUpIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {type Path} from 'sanity'

import {type TreeEditingMenuItem} from '../types'

function hasOpenChild(item: TreeEditingMenuItem, selectedPath: Path | null): boolean {
  return (
    item.children?.some(
      (child) => isEqual(child.path, selectedPath) || hasOpenChild(child, selectedPath),
    ) || false
  )
}

const STACK_SPACE = 2

interface TreeEditingMenuItemProps {
  item: TreeEditingMenuItem
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
}

function MenuItem(props: TreeEditingMenuItemProps) {
  const {item, onPathSelect, selectedPath} = props
  const {children, title} = item
  const hasChildren = children && children.length > 0
  const selected = isEqual(selectedPath, item.path)
  const [open, setOpen] = useState<boolean>(false)

  const handleClick = useCallback(() => {
    onPathSelect(item.path)

    setOpen((v) => !v)
  }, [item.path, onPathSelect])

  const icon = useMemo(() => {
    if (!hasChildren) return null

    return open ? <ChevronUpIcon /> : <ChevronDownIcon />
  }, [hasChildren, open])

  useEffect(() => {
    const hasOpen = hasOpenChild(item, selectedPath)

    if (hasOpen) {
      setOpen(true)
    }
  }, [item, selectedPath])

  return (
    <Stack as="li" key={title} space={STACK_SPACE}>
      <Button mode="bleed" onClick={handleClick} padding={2} selected={selected}>
        <Flex align="center" justify="space-between" gap={3}>
          <Box flex={1}>
            <Text size={1} textOverflow="ellipsis" weight={selected ? 'medium' : undefined}>
              {title}
            </Text>
          </Box>

          {icon && (
            <Text size={0} muted>
              {icon}
            </Text>
          )}
        </Flex>
      </Button>

      {open && hasChildren && (
        <Stack as="ul" paddingLeft={2} space={STACK_SPACE}>
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
    <Stack as="ul" space={STACK_SPACE}>
      {items.map((item) => (
        <MenuItem
          item={item}
          key={toString(item.path)}
          onPathSelect={onPathSelect}
          selectedPath={selectedPath}
        />
      ))}
    </Stack>
  )
})
