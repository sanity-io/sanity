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
import {type DialogItem} from '../../types'

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

type Item = DialogItem[] | DialogItem

interface MenuButtonProps {
  item: DialogItem
  onPathSelect: (path: Path) => void
  isSelected: boolean
  isLast: boolean
}

const MenuCard = function MenuCard(
  props: MenuButtonProps & {
    siblings: Map<string, {count: number; index: number}>
  },
) {
  const {item, onPathSelect, isSelected, isLast, siblings} = props

  const {value} = useValuePreviewWithFallback({
    schemaType: item.schemaType,
    value: item.value,
  })

  const parentPath = item.path.slice(0, -1)
  const parentPathString = pathToString(parentPath)

  const selectedIndex = siblings.get(parentPathString)?.index
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
      style={{minWidth: 0, width: '100%'}}
    >
      <Flex align="center" style={{minWidth: 0, maxWidth: '250px'}}>
        {selectedIndex && (
          <Box flex="none">
            <Badge>#{selectedIndex}</Badge>
          </Box>
        )}
        <Box
          padding={1}
          style={{
            minWidth: 0,
            overflow: 'hidden',
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
  items: DialogItem[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
  siblings: Map<string, {count: number; index: number}>
}

export function DialogBreadcrumbs(props: BreadcrumbsProps): React.JSX.Element | null {
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
    const len = itemsProp.length + 1 // +1 for the root item (the field name)
    // Account for root item in the total visible count
    const availableSlots = maxLength - 1
    const beforeLength = Math.ceil(availableSlots / 2)
    const afterLength = Math.floor(availableSlots / 2)

    if (maxLength && len > maxLength) {
      return [
        ...itemsProp.slice(0, beforeLength - 1),
        itemsProp.slice(beforeLength - 1, itemsProp.length - afterLength),
        ...itemsProp.slice(itemsProp.length - afterLength),
      ]
    }

    return itemsProp
  }, [itemsProp, maxLength])

  const nodes = useMemo(() => {
    return items.map((item, index) => {
      const key = `${item}-${index}`
      const showSeparator = index < items.length - 1

      // If items are grouped in an array, those items are "collapsed" and should
      // be grouped in the same breadcrumbs menu button (i.e. the "..." button).
      if (Array.isArray(item)) {
        return (
          <Inline key={key}>
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
                  {item.map((overflowItem: DialogItem) => (
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
          />

          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Inline>
      )
    })
  }, [items, selectedPath, onPathSelect, siblings])

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
            style={{
              textTransform: 'capitalize',
              minWidth: 0,
            }}
          >
            <Text
              muted
              size={1}
              textOverflow="ellipsis"
              style={{whiteSpace: 'nowrap', maxWidth: '250px'}}
            >
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
