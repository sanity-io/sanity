import {useTelemetry} from '@sanity/telemetry/react'
import {type Path} from '@sanity/types'
import {
  Badge,
  Box,
  // eslint-disable-next-line no-restricted-imports
  Button,
  Card, // Custom button needed, special padding support required
  Flex,
  Inline,
  Menu,
  Text,
  useElementSize,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {isEqual} from 'lodash'
import {
  type ForwardedRef,
  forwardRef,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {css, styled} from 'styled-components'

import {MenuButton} from '../../../../../../ui-components'
import {pathToString} from '../../../../../field/paths/helpers'
import {NavigatedToNestedObjectViaBreadcrumb} from '../../__telemetry__/nestedObjects.telemetry'
import {useValuePreviewWithFallback} from '../../hooks'
import {type BreadcrumbItem} from '../../types'

const MAX_LENGTH = 5
const EMPTY_ARRAY: [] = []
const SEPARATOR = '/'

// Prevent wrapping and ensure horizontal overflow is handled gracefully
const RootInline = styled(Inline)`
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;
  width: 100%;
`

const StyledButton = styled(Button)(({theme}: {theme: Theme}) => {
  const {bold} = getTheme_v2(theme)?.font.text?.weights || {}

  return css`
    max-height: 1rem;
    overflow: hidden;
    min-width: 2ch;

    &[data-active='true'] {
      [data-ui='Text']:first-child {
        font-weight: ${bold};
      }
    }
  `
})

const StyledText = styled(Text)`
  overflow: hidden;
  padding: 8px 0;
`

type Item = BreadcrumbItem[] | BreadcrumbItem

interface MenuButtonProps {
  item: BreadcrumbItem
  onPathSelect: (path: Path) => void
  isSelected: boolean
  isLast: boolean
  maxWidthPx?: number
}

const MenuCard = function MenuCard(
  props: MenuButtonProps & {
    siblings: Map<string, {count: number; index: number}>
  },
) {
  const {item, onPathSelect, isSelected, isLast, siblings, maxWidthPx} = props

  const {value} = useValuePreviewWithFallback({
    schemaType: item.schemaType,
    value: item.value,
  })

  const parentPath = item.path.slice(0, -1)
  const parentPathString = pathToString(parentPath)

  const selectedInex = siblings.get(parentPathString)?.index
  const telemetry = useTelemetry()

  const title = value.title

  const handleClick = useCallback(() => {
    onPathSelect(item.path)
    telemetry.log(NavigatedToNestedObjectViaBreadcrumb, {
      path: pathToString(item.path),
    })
  }, [onPathSelect, item.path, telemetry])

  return (
    <Card
      as="button"
      padding={1}
      radius={3}
      onClick={handleClick}
      // forces ellipsis on the last item if needed
      style={{minWidth: 0, width: isLast ? '100%' : undefined}}
    >
      <Flex align="center" style={{minWidth: 0}}>
        {selectedInex && (
          <Box flex="none">
            <Badge>#{selectedInex}</Badge>
          </Box>
        )}
        <Box
          padding={1}
          style={{
            minWidth: 0,
            overflow: 'hidden',
            // forces ellipsis on the last item if needed
            maxWidth: isLast && maxWidthPx !== undefined ? `${maxWidthPx}px` : `200px`,
          }}
          flex={isLast ? 1 : undefined}
        >
          <Text
            muted={!isSelected}
            size={1}
            weight={isSelected ? 'bold' : 'medium'}
            textOverflow="ellipsis"
            style={{whiteSpace: 'nowrap'}}
            title={title}
          >
            {title}
          </Text>
        </Box>
      </Flex>
    </Card>
  )
}

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

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  siblings: Map<string, {count: number; index: number}>
}

export function Breadcrumbs(props: BreadcrumbsProps): React.JSX.Element | null {
  const {items: itemsProp = EMPTY_ARRAY, onPathSelect, selectedPath, siblings} = props

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const size = useElementSize(rootElement)

  // Dynamically calculate the max length of the breadcrumbs
  // based on the width of the container. If the length of the items
  // is greater than the max length, the items will be grouped in an array
  // and shown in the same breadcrumbs menu button (i.e. the "..." button).
  const maxLength = useMemo(() => {
    const w = size?.border.width

    if (!w) return MAX_LENGTH
    if (w < 500) return 3
    if (w < 700) return 4

    return MAX_LENGTH
  }, [size?.border.width])

  const items: Item[] = useMemo(() => {
    const len = itemsProp.length
    const beforeLength = Math.ceil(maxLength / 2)
    const afterLength = Math.floor(maxLength / 2)

    if (maxLength && len > maxLength) {
      return [
        ...itemsProp.slice(0, beforeLength - 1),
        itemsProp.slice(beforeLength - 1, len - afterLength),
        ...itemsProp.slice(len - afterLength),
      ]
    }

    return itemsProp
  }, [itemsProp, maxLength])

  const itemRefs = useState<Array<HTMLDivElement | null>>([])[0]

  const lastItemMaxWidth = useMemo(() => {
    const parentWidth = size?.border.width || 0
    const count = items.length
    if (!parentWidth || count === 0) return undefined
    const existingItemsExceptLast = itemRefs.slice(0, Math.max(0, count - 1))
    const existingItemsWidth = existingItemsExceptLast.reduce(
      (acc, el) => acc + (el?.offsetWidth || 0),
      0,
    )
    const available = parentWidth - existingItemsWidth
    if (available <= 0) return 0
    return Math.floor(available)
  }, [size?.border.width, items, itemRefs])

  const nodes = useMemo(() => {
    return items.map((item, index) => {
      const key = `${item}-${index}`
      const showSeparator = index < items.length - 1

      // If items are grouped in an array, those items are "collapsed" and should
      // be grouped in the same breadcrumbs menu button (i.e. the "..." button).
      if (Array.isArray(item)) {
        return (
          <Inline
            key={key}
            ref={(el) => {
              itemRefs[index] = el as HTMLDivElement | null
            }}
          >
            <MenuButton
              id="breadcrumb-overflow-menu-button"
              button={
                <StyledButton mode="bleed" padding={1}>
                  <Flex overflow="hidden">
                    <StyledText size={1} weight="medium" textOverflow="ellipsis">
                      ...
                    </StyledText>
                  </Flex>
                </StyledButton>
              }
              popover={{
                placement: 'bottom-start',
                portal: true,
              }}
              menu={
                <Menu>
                  {item.map((overflowItem: BreadcrumbItem) => (
                    <Box key={overflowItem.path.toString()} padding={1}>
                      <Flex direction="row" align="center" style={{maxWidth: '250px'}}>
                        <SeparatorItem>{SEPARATOR}</SeparatorItem>
                        <MenuCard
                          key={overflowItem.path.toString()}
                          item={overflowItem}
                          onPathSelect={onPathSelect}
                          isSelected={false}
                          isLast={false}
                          siblings={siblings}
                        />
                      </Flex>
                    </Box>
                  ))}
                </Menu>
              }
            />

            {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
          </Inline>
        )
      }

      const isSelected = isEqual(item.path, selectedPath)
      const isLast = index === items.length - 1

      return (
        <Inline
          key={key}
          ref={(el) => {
            itemRefs[index] = el as HTMLDivElement | null
          }}
          flex={isLast ? 1 : undefined}
          style={{
            minWidth: 0,
          }}
        >
          <MenuCard
            item={item}
            isSelected={isSelected}
            onPathSelect={onPathSelect}
            isLast={isLast}
            siblings={siblings}
            maxWidthPx={isLast ? lastItemMaxWidth : undefined}
          />

          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Inline>
      )
    })
  }, [items, selectedPath, onPathSelect, siblings, lastItemMaxWidth, itemRefs])

  return (
    <RootInline ref={setRootElement}>
      {
        <Card
          onClick={() => onPathSelect(EMPTY_ARRAY)}
          as="button"
          paddingRight={1}
          paddingY={1}
          radius={3}
        >
          <Flex
            flex={1}
            align="center"
            justify="flex-start"
            overflow="hidden"
            style={{textTransform: 'capitalize', minWidth: 0}}
          >
            <Text muted size={1} textOverflow="ellipsis">
              {selectedPath[0]?.toString()}
            </Text>
          </Flex>
        </Card>
      }
      <SeparatorItem>{SEPARATOR}</SeparatorItem>
      {nodes}
    </RootInline>
  )
}
