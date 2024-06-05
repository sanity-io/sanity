import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button, Flex, Text, useElementSize} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {isEqual} from 'lodash'
import {
  type ForwardedRef,
  forwardRef,
  Fragment,
  type PropsWithChildren,
  useMemo,
  useState,
} from 'react'
import {getSchemaTypeTitle, type Path, unstable_useValuePreview as useValuePreview} from 'sanity'
import {css, styled} from 'styled-components'

import {type TreeEditingBreadcrumb} from '../../types'
import {TreeEditingBreadcrumbsMenuButton} from './TreeEditingBreadcrumbsMenuButton'

const MAX_LENGTH = 5
const EMPTY_ARRAY: [] = []
const SEPARATOR = '/'

const RootFlex = styled(Flex)`
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

type Item = TreeEditingBreadcrumb[] | TreeEditingBreadcrumb

interface MenuButtonProps {
  item: TreeEditingBreadcrumb
  onPathSelect: (path: Path) => void
  isSelected: boolean
}

const MenuButton = forwardRef(function MenuButton(
  props: MenuButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {item, onPathSelect, isSelected, ...rest} = props

  const {value} = useValuePreview({
    schemaType: item.schemaType,
    value: item.value,
  })

  const title = value?.title || 'Untitled'

  // We check if the length is greater than 1 as the root item
  // is also included in the children array.
  const hasChildren = item.children && item.children?.length > 1

  return (
    <StyledButton
      data-active={isSelected ? 'true' : 'false'}
      mode="bleed"
      // eslint-disable-next-line react/jsx-no-bind
      onClick={() => onPathSelect(item.path)}
      padding={1}
      space={2}
      ref={ref}
      {...rest}
    >
      <Flex flex={1} align="center" justify="flex-start" gap={1} overflow="hidden">
        <StyledText size={1} muted={!isSelected} weight="medium" textOverflow="ellipsis">
          {title}
        </StyledText>

        {hasChildren && (
          <Text size={0}>
            <ChevronDownIcon />
          </Text>
        )}
      </Flex>
    </StyledButton>
  )
})

const SeparatorItem = forwardRef(function SeparatorItem(
  props: PropsWithChildren,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {children} = props

  return (
    <Box ref={ref}>
      <Text size={1}>{children}</Text>
    </Box>
  )
})

// Render the title of the menu item in the collapsed breadcrumb
// menu (i.e. the "..." item) with a leading slash.
function renderMenuItemTitle(title: string): string {
  return `/ ${title}`
}

interface TreeEditingBreadcrumbsProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
}

export function TreeEditingBreadcrumbs(props: TreeEditingBreadcrumbsProps): JSX.Element | null {
  const {items: itemsProp = EMPTY_ARRAY, onPathSelect, selectedPath} = props

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const size = useElementSize(rootElement)

  // a dropdown will show the "overflow items" when there are too many
  // levels in the breadcrumbs. This will return how many
  // items the breadcrumb allows before it starts to overflow into a new "..." item
  // which keeps the rest
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

  const nodes = useMemo(() => {
    return items.map((item, index) => {
      const key = `${item}-${index}`
      const showSeparator = index < items.length - 1

      // in instances where we have to show the "..." item
      // which means we have too many items in breadcrumb
      // and so there's an overflow
      if (Array.isArray(item)) {
        return (
          <Fragment key={key}>
            <TreeEditingBreadcrumbsMenuButton
              parentElement={rootElement}
              button={
                <StyledButton mode="bleed" padding={1}>
                  <Flex overflow="hidden">
                    <StyledText size={1} weight="medium" textOverflow="ellipsis">
                      ...
                    </StyledText>
                  </Flex>
                </StyledButton>
              }
              items={item}
              onPathSelect={onPathSelect}
              selectedPath={selectedPath}
              renderMenuItemTitle={renderMenuItemTitle}
            />

            {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
          </Fragment>
        )
      }

      // We check if the length is greater than 1 as the root item
      // is also included in the children array.
      const hasChildren = item.children && item.children?.length > 1

      const isSelected = isEqual(item.path, selectedPath)

      const button = <MenuButton item={item} isSelected={isSelected} onPathSelect={onPathSelect} />

      return (
        <Fragment key={key}>
          {!hasChildren && button}

          {hasChildren && (
            <TreeEditingBreadcrumbsMenuButton
              button={button}
              items={item.children || EMPTY_ARRAY}
              onPathSelect={onPathSelect}
              menuTitle={getSchemaTypeTitle(item.schemaType)}
              parentElement={rootElement}
              // We don't use the `selectedPath` here as the selected path
              // since that is the current selected path and not the selected
              // path of the current breadcrumb item.
              selectedPath={item.path}
            />
          )}

          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Fragment>
      )
    })
  }, [items, selectedPath, onPathSelect, rootElement])

  return (
    <RootFlex align="center" forwardedAs="ol" gap={2} ref={setRootElement}>
      {nodes}
    </RootFlex>
  )
}
