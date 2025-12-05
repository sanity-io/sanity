import {isKeySegment, type Path, type SchemaType} from '@sanity/types'
// eslint-disable-next-line no-restricted-imports
import {Badge, Box, Button, Flex, Inline, Menu, MenuItem, Text, useElementSize} from '@sanity/ui'
import {
  type ForwardedRef,
  forwardRef,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react'

import {MenuButton} from '../../../../ui-components'
import {useFormValue} from '../../contexts/FormValue'
import {useBreadcrumbPreview} from '../../hooks/useBreadcrumbPreview'
import {useBreadcrumbSiblingInfo} from '../../hooks/useBreadcrumbSiblingInfo'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {useFormBuilder} from '../../useFormBuilder'

const MAX_LENGTH = 5
const SEPARATOR = '/'

// Inline styles to replace styled-components
const rootInlineStyle: React.CSSProperties = {
  flexWrap: 'nowrap',
  overflow: 'hidden',
  minWidth: 0,
  width: '100%',
}

const overflowButtonStyle: React.CSSProperties = {
  maxHeight: '1rem',
  overflow: 'hidden',
  minWidth: '2ch',
}

const overflowTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  padding: '8px 0',
}

interface DialogBreadcrumbsProps {
  currentPath?: Path
}

interface BreadcrumbItemData {
  path: Path
}

type BreadcrumbItem = BreadcrumbItemData | BreadcrumbItemData[]

const SeparatorItem = forwardRef(function SeparatorItem(
  props: PropsWithChildren,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {children} = props

  return (
    <Box ref={ref}>
      <Text size={1} muted>
        {children}
      </Text>
    </Box>
  )
})

/**
 * Individual breadcrumb button that fetches its own preview.
 * Used for inline breadcrumb items.
 */
function BreadcrumbButton({
  itemPath,
  documentSchemaType,
  documentValue,
  isSelected = false,
  onPathSelect,
}: {
  itemPath: Path
  documentSchemaType: SchemaType
  documentValue: unknown
  isSelected?: boolean
  onPathSelect: (path: Path) => void
}) {
  const title = useBreadcrumbPreview(itemPath, documentSchemaType, documentValue)
  const siblingInfo = useBreadcrumbSiblingInfo(itemPath, documentSchemaType, documentValue)

  const handleClick = useCallback(() => {
    onPathSelect(itemPath)
  }, [onPathSelect, itemPath])

  return (
    <Button
      mode="bleed"
      padding={1}
      radius={2}
      onClick={handleClick}
      style={{minWidth: 0, maxWidth: '250px'}}
      title={title}
    >
      <Flex align="center" style={{minWidth: 0}}>
        {siblingInfo && (
          <Box flex="none">
            <Badge>#{siblingInfo.index}</Badge>
          </Box>
        )}
        <Box
          padding={1}
          style={{
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Text
            muted={!isSelected}
            size={1}
            weight={isSelected ? 'bold' : 'medium'}
            textOverflow="ellipsis"
            style={{whiteSpace: 'nowrap', textTransform: 'capitalize'}}
          >
            {title}
          </Text>
        </Box>
      </Flex>
    </Button>
  )
}

/**
 * Menu item version of breadcrumb for overflow dropdown.
 * Uses sanity-ui MenuItem for proper keyboard navigation within Menu.
 */
function BreadcrumbMenuItem({
  itemPath,
  documentSchemaType,
  documentValue,
  onPathSelect,
}: {
  itemPath: Path
  documentSchemaType: SchemaType
  documentValue: unknown
  onPathSelect: (path: Path) => void
}) {
  const title = useBreadcrumbPreview(itemPath, documentSchemaType, documentValue)
  const siblingInfo = useBreadcrumbSiblingInfo(itemPath, documentSchemaType, documentValue)

  const handleClick = useCallback(() => {
    onPathSelect(itemPath)
  }, [onPathSelect, itemPath])

  return (
    <MenuItem padding={1} onClick={handleClick}>
      <Flex align="center" style={{minWidth: 0, maxWidth: '250px'}}>
        <Box flex="none" padding={1}>
          <Text size={1} muted>
            {SEPARATOR}
          </Text>
        </Box>
        {siblingInfo && (
          <Box flex="none">
            <Badge>#{siblingInfo.index}</Badge>
          </Box>
        )}
        <Box
          paddingLeft={siblingInfo?.index ? 1 : 0}
          paddingY={1}
          style={{
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <Text
            size={1}
            textOverflow="ellipsis"
            style={{whiteSpace: 'nowrap', textTransform: 'capitalize'}}
            title={title}
          >
            {title}
          </Text>
        </Box>
      </Flex>
    </MenuItem>
  )
}

/**
 * Breadcrumbs component that builds navigation from a Path.
 * Shows each path segment as a clickable breadcrumb with preview titles.
 * Collapses middle items into a "..." menu when there are too many.
 */
export function DialogBreadcrumbs({currentPath}: DialogBreadcrumbsProps): React.JSX.Element | null {
  const {onPathOpen} = useFormCallbacks()
  const {schemaType: documentSchemaType} = useFormBuilder()
  const documentValue = useFormValue([])
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const size = useElementSize(rootElement)

  const handlePathSelect = useCallback(
    (path: Path) => {
      onPathOpen(path)
    },
    [onPathOpen],
  )

  // Calculate max visible items based on container width
  const maxLength = useMemo(() => {
    const w = size?.border.width
    if (!w) return MAX_LENGTH
    if (w < 500) return 3
    if (w < 700) return 4
    return MAX_LENGTH
  }, [size?.border.width])

  // Build raw breadcrumb items from the path (only key segments = array items)
  const rawItems: BreadcrumbItemData[] = useMemo(() => {
    if (!currentPath || currentPath.length === 0) {
      return []
    }

    const result: BreadcrumbItemData[] = []

    currentPath.forEach((segment, index) => {
      // Only include key segments (array items)
      if (isKeySegment(segment)) {
        result.push({
          path: currentPath.slice(0, index + 1),
        })
      }
    })

    return result
  }, [currentPath])

  // Collapse middle items if too many
  const items: BreadcrumbItem[] = useMemo(() => {
    const len = rawItems.length + 1 // +1 for the root field name
    const availableSlots = maxLength - 1
    const beforeLength = Math.ceil(availableSlots / 2)
    const afterLength = Math.floor(availableSlots / 2)

    if (maxLength && len > maxLength) {
      return [
        ...rawItems.slice(0, beforeLength - 1),
        rawItems.slice(beforeLength - 1, rawItems.length - afterLength),
        ...rawItems.slice(rawItems.length - afterLength),
      ]
    }

    return rawItems
  }, [rawItems, maxLength])

  // Get the root field name (first segment of the path)
  const rootFieldName = currentPath?.[0]?.toString()

  if (!currentPath || currentPath.length === 0) {
    return null
  }

  const nodes = items.map((item, index) => {
    const key = `breadcrumb-${index}`
    const showSeparator = index < items.length - 1

    // Collapsed items - render as "..." menu
    if (Array.isArray(item)) {
      return (
        <Inline key={key}>
          <MenuButton
            id="breadcrumb-overflow-menu-button"
            button={
              <Button mode="bleed" padding={1} style={overflowButtonStyle}>
                <Flex overflow="hidden">
                  <Text size={1} weight="medium" textOverflow="ellipsis" style={overflowTextStyle}>
                    ...
                  </Text>
                </Flex>
              </Button>
            }
            popover={{
              placement: 'bottom-start',
              portal: true,
            }}
            menu={
              <Menu>
                {item.map((overflowItem) => (
                  <BreadcrumbMenuItem
                    key={overflowItem.path.toString()}
                    itemPath={overflowItem.path}
                    documentSchemaType={documentSchemaType}
                    documentValue={documentValue}
                    onPathSelect={handlePathSelect}
                  />
                ))}
              </Menu>
            }
          />
          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Inline>
      )
    }

    // Check if this item's path matches the current path (is selected)
    const isSelected =
      currentPath.length === item.path.length &&
      item.path.every((seg, i) => {
        const currentSeg = currentPath[i]
        if (isKeySegment(seg) && isKeySegment(currentSeg)) {
          return seg._key === currentSeg._key
        }
        return seg === currentSeg
      })
    const isLast = index === items.length - 1

    return (
      <Inline
        key={key}
        flex={isLast ? 1 : undefined}
        style={{
          minWidth: 0,
        }}
      >
        <BreadcrumbButton
          itemPath={item.path}
          documentSchemaType={documentSchemaType}
          documentValue={documentValue}
          isSelected={isSelected}
          onPathSelect={handlePathSelect}
        />
        {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
      </Inline>
    )
  })

  return (
    <Inline ref={setRootElement} style={rootInlineStyle}>
      <Button
        mode="bleed"
        padding={2}
        radius={2}
        onClick={() => handlePathSelect([])}
        style={{minWidth: 0, maxWidth: '250px'}}
        title={rootFieldName}
      >
        <Text
          muted
          size={1}
          textOverflow="ellipsis"
          style={{whiteSpace: 'nowrap', textTransform: 'capitalize'}}
        >
          {rootFieldName}
        </Text>
      </Button>
      <SeparatorItem>{SEPARATOR}</SeparatorItem>
      {nodes}
    </Inline>
  )
}
