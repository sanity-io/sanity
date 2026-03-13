import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, isObjectSchemaType, type Path, type SchemaType} from '@sanity/types'
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
import {pathToString} from '../../../field/paths/helpers'
import {resolveSchemaTypeForPath} from '../../../studio/copyPaste/resolveSchemaTypeForPath'
import {useFormValue} from '../../contexts/FormValue'
import {useBreadcrumbPreview} from '../../hooks/useBreadcrumbPreview'
import {useBreadcrumbSiblingInfo} from '../../hooks/useBreadcrumbSiblingInfo'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {NavigatedToNestedObjectViaBreadcrumb} from '../../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {shouldBeInBreadcrumb} from '../../studio/tree-editing/utils/build-tree-editing-state/utils'
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
  /** Callback to navigate to a path, updating the form path and cleaning up the dialog stack. */
  onNavigate?: (path: Path) => void
  /** Callback to differentiate between closing all dialogs and closing the top dialog. Used when navigating above all dialog levels. */
  onClose?: (closeAll?: boolean) => void
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
  currentPath,
  isSelected = false,
  onPathSelect,
}: {
  itemPath: Path
  documentSchemaType: SchemaType
  documentValue: unknown
  currentPath?: Path
  isSelected?: boolean
  onPathSelect: (path: Path) => void
}) {
  const title = useBreadcrumbPreview(itemPath, documentSchemaType, documentValue, currentPath)
  const siblingInfo = useBreadcrumbSiblingInfo(itemPath, documentSchemaType, documentValue)
  const telemetry = useTelemetry()

  const handleClick = useCallback(() => {
    onPathSelect(itemPath)
    telemetry.log(NavigatedToNestedObjectViaBreadcrumb, {
      path: pathToString(itemPath),
    })
  }, [onPathSelect, itemPath, telemetry])

  return (
    <Button
      mode="bleed"
      padding={1}
      radius={2}
      onClick={handleClick}
      style={{minWidth: 0, maxWidth: '250px'}}
      title={title}
      aria-label={title}
      aria-current={isSelected ? 'location' : false}
      data-testid={`breadcrumb-item-${title?.toLowerCase().replace(/ /g, '-')}`}
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
  currentPath,
  onPathSelect,
}: {
  itemPath: Path
  documentSchemaType: SchemaType
  documentValue: unknown
  currentPath?: Path
  onPathSelect: (path: Path) => void
}) {
  const title = useBreadcrumbPreview(itemPath, documentSchemaType, documentValue, currentPath)
  const siblingInfo = useBreadcrumbSiblingInfo(itemPath, documentSchemaType, documentValue)

  const handleClick = useCallback(() => {
    onPathSelect(itemPath)
  }, [onPathSelect, itemPath])

  return (
    <MenuItem padding={1} onClick={handleClick}>
      <Flex align="center" style={{minWidth: 0, maxWidth: '250px'}}>
        {siblingInfo && <Badge size={1}>#{siblingInfo.index}</Badge>}
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
export function DialogBreadcrumbs({
  currentPath,
  onNavigate,
  onClose,
}: DialogBreadcrumbsProps): React.JSX.Element | null {
  const {onPathOpen} = useFormCallbacks()
  const {schemaType: documentSchemaType} = useFormBuilder()
  const documentValue = useFormValue([])
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const size = useElementSize(rootElement)

  // Use onNavigate (which updates both the form path and dialog stack) when available,
  // falling back to raw onPathOpen for backwards compatibility.
  const navigate = onNavigate ?? onPathOpen

  const handlePathSelect = useCallback(
    (path: Path) => {
      // If it's an array item breadcrumb, try to open to the field being viewed
      if (isKeySegment(path[path.length - 1])) {
        // Check if currentPath extends this path with at least one field name
        // Example: path = ['animals', {_key: 'x'}], currentPath = ['animals', {_key: 'x'}, 'friend', ...]
        // What this means is that we are then moving back in the stack of dialogs
        if (currentPath && currentPath.length > path.length) {
          const pathsMatch = path.every((segment, index) => {
            const currentSegment = currentPath[index]
            return isKeySegment(segment) && isKeySegment(currentSegment)
              ? segment._key === currentSegment._key
              : segment === currentSegment
          })

          if (pathsMatch) {
            const nextSegment = currentPath[path.length]
            // If the next segment is not a key segment, it's a field name
            if (!isKeySegment(nextSegment)) {
              // Verify the field exists in the schema
              const itemSchemaType = resolveSchemaTypeForPath(
                documentSchemaType,
                path,
                documentValue,
              )
              // eslint-disable-next-line max-depth
              if (
                isObjectSchemaType(itemSchemaType) &&
                itemSchemaType.fields.some((field) => field.name === nextSegment)
              ) {
                // What this means is that we're opening to the field that was being viewed
                // Which means that it will focus on the field
                navigate([...path, nextSegment])
                return
              }
            }
          }
        }

        // Fallback: open to the item itself
        navigate(path)
      } else if (path.length === 1) {
        // Non-key segment (field name like "animals") — this means navigating above
        // all dialog levels, so close everything rather than navigating to a field path.
        onClose?.(true)
      } else {
        navigate(path)
      }
    },
    [navigate, onClose, documentSchemaType, documentValue, currentPath],
  )

  // Calculate max visible items based on container width
  const maxLength = useMemo(() => {
    const w = size?.border.width
    if (!w) return MAX_LENGTH
    if (w < 500) return 5
    if (w < 700) return 6
    return MAX_LENGTH
  }, [size?.border.width])

  // Build raw breadcrumb items from the path (only key segments = array items)
  // Also filter out PTE blocks (blocks with span children)
  const rawItems: BreadcrumbItemData[] = useMemo(() => {
    if (!currentPath || currentPath.length === 0) {
      return []
    }

    const result: BreadcrumbItemData[] = []

    currentPath.forEach((segment, index) => {
      // Only include key segments (array items)
      const itemPath = currentPath.slice(0, index + 1)
      // Use shouldBeInBreadcrumb to filter out PTE blocks
      if (shouldBeInBreadcrumb(itemPath, currentPath, documentValue)) {
        result.push({
          path: itemPath,
        })
      }
    })

    return result
  }, [currentPath, documentValue])

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
                  <Text
                    size={1}
                    weight="medium"
                    textOverflow="ellipsis"
                    style={overflowTextStyle}
                    aria-label="More breadcrumb items"
                  >
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
                    currentPath={currentPath}
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
          currentPath={currentPath}
          isSelected={isSelected}
          onPathSelect={handlePathSelect}
        />
        {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
      </Inline>
    )
  })

  return (
    <Inline ref={setRootElement} style={rootInlineStyle}>
      {nodes}
    </Inline>
  )
}
