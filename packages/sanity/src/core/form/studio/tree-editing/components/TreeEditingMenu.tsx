import {ChevronDownIcon, ChevronUpIcon, StackCompactIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {toString} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {type Path} from 'sanity'
import scrollIntoViewIfNeeded, {type StandardBehaviorOptions} from 'scroll-into-view-if-needed'
import {css, styled} from 'styled-components'

import {type TreeEditingMenuItem} from '../types'
import {isArrayItemPath} from '../utils/build-tree-editing-state/utils'

function hasOpenChild(item: TreeEditingMenuItem, selectedPath: Path | null): boolean {
  return (
    item.children?.some(
      (child) => isEqual(child.path, selectedPath) || hasOpenChild(child, selectedPath),
    ) || false
  )
}

const STACK_SPACE = 2

const SCROLL_BEHAVIOR_OPTIONS: StandardBehaviorOptions = {
  block: 'center',
  behavior: 'smooth',
  scrollMode: 'if-needed',
}

const ItemFlex = styled(Flex)(({theme}) => {
  const hoverBg = theme.sanity.v2?.color.button.bleed.default.hovered.bg
  const hoverBg2 = theme.sanity.v2?.color.button.bleed.default.pressed.bg
  const selectedBg = theme.sanity.v2?.color.button.bleed.default.selected.bg

  return css`
    padding: 2px;
    padding-right: 3px;
    box-sizing: border-box;
    transition: inherit;

    &[data-selected='true'] {
      background-color: ${selectedBg};
      border-radius: ${theme.sanity.radius[2]}px;
    }

    [data-ui='Button'] {
      transition: inherit;
    }

    @media (hover: hover) {
      &:hover {
        &[data-selected='false'] {
          background-color: ${hoverBg};
          border-radius: ${theme.sanity.radius[2]}px;

          [data-ui='Button']:last-child:not(:only-child):hover {
            background-color: ${hoverBg2};
          }
        }

        [data-ui='Button']:last-child:not(:only-child):hover {
          background-color: ${hoverBg};
        }
      }
    }

    [data-ui='Button'] {
      background-color: inherit;
    }
  `
})

interface TreeEditingMenuItemProps {
  item: TreeEditingMenuItem
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
}

function MenuItem(props: TreeEditingMenuItemProps) {
  const {item, onPathSelect, selectedPath} = props
  const {children, title} = item
  const hasChildren = children && children.length > 0
  const [open, setOpen] = useState<boolean>(false)

  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)

  const selected = useMemo(() => isEqual(item.path, selectedPath), [item.path, selectedPath])
  const isArrayParent = useMemo(() => !isArrayItemPath(item.path), [item.path])

  const handleClick = useCallback(() => {
    onPathSelect(item.path)
  }, [item.path, onPathSelect])

  const handleExpandClick = useCallback(() => {
    setOpen((v) => !v)
  }, [])

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

  // Scroll to the selected item
  useEffect(() => {
    if (!rootElement || !selected) return

    scrollIntoViewIfNeeded(rootElement, SCROLL_BEHAVIOR_OPTIONS)
  }, [rootElement, selected])

  const titleNode = useMemo(
    () => (
      <Box flex={1}>
        <Text size={1} textOverflow="ellipsis" weight={selected ? 'medium' : undefined}>
          {title}
        </Text>
      </Box>
    ),
    [title, selected],
  )

  return (
    <Stack
      aria-expanded={open}
      as="li"
      key={title}
      ref={setRootElement}
      role="treeitem"
      space={STACK_SPACE}
    >
      <Card data-as="button" radius={2} tone="inherit">
        <ItemFlex align="center" data-selected={selected} data-testid="side-menu-item" gap={1}>
          <Stack flex={1}>
            <Button mode="bleed" onClick={handleClick} padding={2}>
              <Flex align="center" gap={2}>
                {isArrayParent && (
                  <Text size={1}>
                    <StackCompactIcon />
                  </Text>
                )}

                {titleNode}
              </Flex>
            </Button>
          </Stack>

          {icon && (
            <Button
              aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
              mode="bleed"
              onClick={handleExpandClick}
              padding={2}
            >
              <Text size={0} muted>
                {icon}
              </Text>
            </Button>
          )}
        </ItemFlex>
      </Card>

      {open && hasChildren && (
        <Stack as="ul" paddingLeft={2} role="group" space={STACK_SPACE}>
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
    <Stack as="ul" role="tree" space={STACK_SPACE}>
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
