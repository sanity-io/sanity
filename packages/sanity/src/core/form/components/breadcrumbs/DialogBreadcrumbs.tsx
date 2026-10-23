import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, type Path, type SchemaType} from '@sanity/types'
// oxlint-disable-next-line no-restricted-imports
import {Badge, Button, Inline, Text, useElementSize} from '@sanity/ui'
// oxlint-disable-next-line no-restricted-imports
import {Menu, MenuItem} from '@sanity/ui/menu'
import {isEqual} from '@sanity/util/paths'
import {
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
  type RefAttributes,
} from 'react'
import {EnhancedObjectDialogScrollContext} from 'sanity/_singletons'
import {Box, Flex, PressArea} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {useFormValue} from '../../contexts/FormValue'
import {useBreadcrumbPreview} from '../../hooks/useBreadcrumbPreview'
import {useBreadcrumbSiblingInfo} from '../../hooks/useBreadcrumbSiblingInfo'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {NestedObjectOpened} from '../../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {shouldBeInBreadcrumb} from '../../studio/tree-editing/utils/build-tree-editing-state/utils'
import {useFormBuilder} from '../../useFormBuilder'
import {breadcrumbItem, breadcrumbSurface} from './DialogBreadcrumbs.css'

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

function SeparatorItem(props: PropsWithChildren & RefAttributes<HTMLDivElement>) {
  const {ref, children} = props

  return (
    <Box ref={ref}>
      <Text size={1} muted>
        {children}
      </Text>
    </Box>
  )
}

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
    telemetry.log(NestedObjectOpened, {
      path: 'breadcrumb',
    })
  }, [onPathSelect, itemPath, telemetry])

  return (
    <Box className={breadcrumbItem} width="fit-content" minWidth="0">
      <PressArea
        type="button"
        onClick={handleClick}
        title={title}
        aria-label={title}
        aria-current={isSelected ? 'location' : false}
        data-testid={`breadcrumb-item-${title?.toLowerCase().replace(/ /g, '-')}`}
      >
        <Box className={breadcrumbSurface} padding={1} radius={2}>
          <Flex alignItems="center" style={{minWidth: 0}}>
            {siblingInfo && (
              <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
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
        </Box>
      </PressArea>
    </Box>
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
      <Flex alignItems="center" style={{minWidth: 0, maxWidth: '250px'}}>
        {siblingInfo && <Badge>#{siblingInfo.index}</Badge>}
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
  const {onPathFocus, onPathOpen} = useFormCallbacks()
  const scrollToTop = useContext(EnhancedObjectDialogScrollContext)
  const {schemaType: documentSchemaType} = useFormBuilder()
  const documentValue = useFormValue([])
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const size = useElementSize(rootElement)

  // Use onNavigate (which updates both the form path and dialog stack) when available,
  // falling back to raw onPathOpen for backwards compatibility.
  const navigate = onNavigate ?? onPathOpen

  const handlePathSelect = useCallback(
    (path: Path) => {
      const lastSegment = path[path.length - 1]

      // An array item breadcrumb is the title of the dialog that edits the item:
      // show that dialog, scrolled to the top.
      if (isKeySegment(lastSegment)) {
        if (!currentPath || !isEqual(path, currentPath)) {
          navigate(path)
        }
        scrollToTop?.(path)
        return
      }

      // Stands for the annotation it edits (the breadcrumb shows the annotated text), not
      // for a field the user can focus.
      if (lastSegment === 'markDefs') {
        navigate(path)
        return
      }

      // A field breadcrumb shows the dialog the field is in, scrolled to the field, and
      // moves focus onto it. A top-level field is in the document form, above every dialog.
      if (path.length === 1) {
        onClose?.(true)
      } else {
        navigate(path)
      }
      onPathFocus(path)
    },
    [navigate, onClose, onPathFocus, scrollToTop, currentPath],
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
    const isSelected = isEqual(item.path, currentPath)
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
