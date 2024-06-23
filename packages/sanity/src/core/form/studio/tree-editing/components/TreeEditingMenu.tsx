/* eslint-disable max-nested-callbacks */
import {hues} from '@sanity/color'
import {ChevronRightIcon, StackCompactIcon} from '@sanity/icons'
import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {getSchemaTypeTitle, type Path, SanityDefaultPreview, useTranslation} from 'sanity'
import scrollIntoViewIfNeeded, {type StandardBehaviorOptions} from 'scroll-into-view-if-needed'
import {css, styled} from 'styled-components'

import {useValuePreviewWithFallback} from '../hooks'
import {type TreeEditingMenuItem} from '../types'
import {isArrayItemPath} from '../utils/build-tree-editing-state/utils'

function hasOpenChild(item: TreeEditingMenuItem, selectedPath: Path | null): boolean {
  return (
    item.children?.some(
      (child) => isEqual(child.path, selectedPath) || hasOpenChild(child, selectedPath),
    ) || false
  )
}

const SCROLL_BEHAVIOR_OPTIONS: StandardBehaviorOptions = {
  block: 'center',
  behavior: 'smooth',
  scrollMode: 'if-needed',
}

const AnimateChevronIcon = styled(ChevronRightIcon)`
  transition: transform 0.2s ease;

  &[data-expanded='true'] {
    transform: rotate(90deg);
  }
`

// This component is used to keep buttons aligned in the tree menu
// when the expand button is not present on an item.
// The width should match the width of the expand button.
const Spacer = styled.div`
  min-width: 23px;
  max-width: 23px;
`

const ChildStack = styled(Stack)(({theme}) => {
  const space = getTheme_v2(theme)?.space[3] || 0
  const isDark = getTheme_v2(theme)?.color._dark
  const borderColor = hues.gray[isDark ? 900 : 200].hex

  return css`
    margin-left: ${space + 2}px;
    box-sizing: border-box;
    border-left: 1px solid ${borderColor};
  `
})

const ItemFlex = styled(Flex)(({theme}) => {
  const defaultHoverBg = getTheme_v2(theme)?.color.button.bleed.default.hovered.bg
  const selectedHoverBg = getTheme_v2(theme)?.color.button.bleed.default.pressed.bg
  const selectedBg = getTheme_v2(theme)?.color.button.bleed.default.selected.bg

  return css`
    padding: 2px;
    padding-right: 3px;
    box-sizing: border-box;
    transition: inherit;

    &[data-selected='true'] {
      background-color: ${selectedBg};
      border-radius: ${theme.sanity.radius[2]}px;
    }

    [data-ui='ExpandButton'],
    [data-ui='NavigateButton'] {
      transition: inherit;
      background-color: inherit;
    }

    @media (hover: hover) {
      &:hover {
        &[data-selected='false'] {
          background-color: ${defaultHoverBg};
          border-radius: ${getTheme_v2(theme).radius[2]}px;

          [data-ui='ExpandButton']:hover {
            background-color: ${selectedHoverBg};
          }
        }

        [data-ui='ExpandButton']:hover {
          background-color: ${defaultHoverBg};
        }
      }
    }
  `
})

interface TreeEditingMenuItemProps {
  item: TreeEditingMenuItem
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
  siblingHasChildren?: boolean
}

function MenuItem(props: TreeEditingMenuItemProps) {
  const {item, onPathSelect, selectedPath, siblingHasChildren} = props
  const {children} = item
  const hasChildren = children && children.length > 0
  const [open, setOpen] = useState<boolean>(false)
  const {t} = useTranslation()

  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)

  const selected = useMemo(() => isEqual(item.path, selectedPath), [item.path, selectedPath])
  const isArrayParent = useMemo(() => !isArrayItemPath(item.path), [item.path])

  const {value} = useValuePreviewWithFallback({
    schemaType: item.schemaType,
    value: item.value,
  })

  const title = useMemo(() => {
    // If the item is an array parent, we want to show the schema type title
    if (isArrayParent) {
      return getSchemaTypeTitle(item.schemaType)
    }

    // Else, we show the preview title
    return value.title
  }, [isArrayParent, item.schemaType, value.title])

  const handleClick = useCallback(() => {
    onPathSelect(item.path)
  }, [item.path, onPathSelect])

  const handleExpandClick = useCallback(() => setOpen((v) => !v), [])

  const icon = useMemo(() => {
    if (!hasChildren) return null

    return <AnimateChevronIcon data-expanded={open ? 'true' : 'false'} />
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

  return (
    <Stack
      aria-expanded={open}
      as="li"
      key={toString(item.path)}
      ref={setRootElement}
      role="treeitem"
      space={1}
    >
      <Card data-as="button" radius={2} tone="inherit">
        <ItemFlex align="center" data-selected={selected} data-testid="side-menu-item">
          {icon && (
            <Button
              aria-label={`${open ? t('tree-editing-dialog.sidebar.action.collapse') : t('tree-editing-dialog.sidebar.action.expand')} ${title}`}
              data-ui="ExpandButton"
              mode="bleed"
              onClick={handleExpandClick}
              padding={2}
            >
              <Text size={0} muted>
                {icon}
              </Text>
            </Button>
          )}

          {!icon && siblingHasChildren && <Spacer />}

          <Stack flex={1}>
            <Button
              data-ui="NavigateButton"
              mode="bleed"
              onClick={handleClick}
              padding={1}
              title={title}
            >
              <Flex align="center">
                <SanityDefaultPreview
                  title={title}
                  media={isArrayParent ? <StackCompactIcon /> : value.media}
                  layout="inline"
                />
              </Flex>
            </Button>
          </Stack>
        </ItemFlex>
      </Card>

      {open && hasChildren && (
        <ChildStack flex={1} forwardedAs="ul" paddingLeft={1} role="group" space={1}>
          {children.map((child) => {
            const childSiblingHasChildren = children.some(
              (sibling) => sibling.children && sibling.children.length > 0,
            )

            return (
              <MenuItem
                item={child}
                key={toString(child.path)}
                onPathSelect={onPathSelect}
                selectedPath={selectedPath}
                siblingHasChildren={childSiblingHasChildren}
              />
            )
          })}
        </ChildStack>
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
    <Stack as="ul" role="tree" space={2}>
      {items.map((item) => {
        const siblingHasChildren = items.some(
          (sibling) => sibling.children && sibling.children.length > 0,
        )

        return (
          <MenuItem
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
