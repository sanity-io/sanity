import {hues} from '@sanity/color'
import {ChevronRightIcon, StackCompactIcon} from '@sanity/icons'
import {type Path} from '@sanity/types'
import {
  // eslint-disable-next-line no-restricted-imports
  Button, // Custom button needed, special children support required
  Card,
  Flex,
  Stack,
  Text,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {useTranslation} from 'react-i18next'
import scrollIntoViewIfNeeded, {type StandardBehaviorOptions} from 'scroll-into-view-if-needed'
import {css, styled} from 'styled-components'

import {SanityDefaultPreview} from '../../../../../preview/components/SanityDefaultPreview'
import {getSchemaTypeTitle} from '../../../../../schema/helpers'
import {useValuePreviewWithFallback} from '../../hooks'
import {type TreeEditingMenuItem as TreeEditingMenuItemType} from '../../types'
import {isArrayItemPath} from '../../utils/build-tree-editing-state/utils'
import {getSiblingHasChildren} from './utils'

function hasOpenChild(item: TreeEditingMenuItemType, selectedPath: Path | null): boolean {
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
    border-radius: ${getTheme_v2(theme).radius[2]}px;

    &[data-selected='true'] {
      background-color: ${selectedBg};
    }

    [data-ui='ExpandButton'],
    [data-ui='NavigateButton'] {
      transition: inherit;
      background-color: inherit;
      box-shadow: unset;
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
  item: TreeEditingMenuItemType
  onPathSelect: (path: Path) => void
  selectedPath: Path | null
  siblingHasChildren?: boolean
}

export function TreeEditingMenuItem(props: TreeEditingMenuItemProps): React.JSX.Element {
  const {item, onPathSelect, selectedPath, siblingHasChildren} = props
  const {children} = item
  const hasChildren = children && children.length > 0

  const [open, setOpen] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)

  const {t} = useTranslation()

  const {value} = useValuePreviewWithFallback({
    schemaType: item.schemaType,
    value: item.value,
  })

  const selected = useMemo(() => isEqual(item.path, selectedPath), [item.path, selectedPath])
  const isArrayParent = useMemo(() => !isArrayItemPath(item.path), [item.path])
  const stringPath = useMemo(() => toString(item.path), [item.path])

  const title = useMemo(() => {
    // If the item is an array parent, we want to show the schema type title
    if (isArrayParent) {
      return getSchemaTypeTitle(item.schemaType)
    }

    // Else, we show the preview title
    return value.title
  }, [isArrayParent, item.schemaType, value.title])

  const icon = useMemo(() => {
    if (!hasChildren) return null

    return <AnimateChevronIcon data-expanded={open ? 'true' : 'false'} />
  }, [hasChildren, open])

  const media = useMemo(() => {
    if (isArrayParent) {
      return <StackCompactIcon />
    }

    return value.media
  }, [isArrayParent, value.media])

  const handleClick = useCallback(() => onPathSelect(item.path), [item.path, onPathSelect])

  const handleExpandClick = useCallback(() => setOpen((v) => !v), [])

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
      key={stringPath}
      ref={setRootElement}
      role="treeitem"
      space={1}
    >
      <Card
        data-as="button"
        data-testid="tree-editing-menu-item"
        overflow="hidden"
        radius={2}
        tone="inherit"
      >
        <ItemFlex
          align="center"
          data-selected={selected}
          data-testid="tree-editing-menu-item-content"
        >
          {icon && (
            <Button
              aria-label={`${open ? t('tree-editing-dialog.sidebar.action.collapse') : t('tree-editing-dialog.sidebar.action.expand')} ${title}`}
              data-testid={`tree-editing-menu-expand-button-${stringPath}`}
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
              data-testid={`tree-editing-menu-navigate-button-${stringPath}`}
              data-ui="NavigateButton"
              mode="bleed"
              onClick={handleClick}
              padding={1}
              title={title}
            >
              <Flex align="center">
                <SanityDefaultPreview layout="inline" media={media} title={title} />
              </Flex>
            </Button>
          </Stack>
        </ItemFlex>
      </Card>

      {open && hasChildren && (
        <ChildStack flex={1} forwardedAs="ul" paddingLeft={1} role="group" space={1}>
          {children.map((child) => {
            const childSiblingHasChildren = getSiblingHasChildren(children)

            return (
              <TreeEditingMenuItem
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
