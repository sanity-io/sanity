import {Box, Button, Flex, Text, useElementSize} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {isEqual} from 'lodash'
import {
  type ForwardedRef,
  forwardRef,
  Fragment,
  type PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from 'react'
import {type Path, SanityDefaultPreview} from 'sanity'
import {css, styled} from 'styled-components'

import {useValuePreviewWithFallback} from '../../hooks'
import {type ArrayEditingBreadcrumb} from '../../types'
import {ArrayEditingBreadcrumbsMenuButton} from './ArrayEditingBreadcrumbsMenuButton'

const MAX_LENGTH = 5
const EMPTY_ARRAY: [] = []
const SEPARATOR = '/'

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

type Item = ArrayEditingBreadcrumb[] | ArrayEditingBreadcrumb

interface MenuButtonProps {
  item: ArrayEditingBreadcrumb
  onPathSelect: (path: Path) => void
  isSelected: boolean
}

const MenuButton = forwardRef(function MenuButton(
  props: MenuButtonProps,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {item, onPathSelect, isSelected, ...rest} = props

  const {value} = useValuePreviewWithFallback({
    schemaType: item.schemaType,
    value: item.value,
  })

  const handlePathSelect = useCallback(() => {
    onPathSelect(item.path)
  }, [item.path, onPathSelect])

  const title = value.title

  return (
    <StyledButton
      data-active={isSelected ? 'true' : 'false'}
      mode="bleed"
      onClick={handlePathSelect}
      padding={1}
      ref={ref}
      space={2}
      title={title}
      {...rest}
    >
      <Flex flex={1} align="center" justify="flex-start" gap={1} overflow="hidden">
        <SanityDefaultPreview title={title} media={value.media} layout="inline" />
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

interface ArrayEditingBreadcrumbsProps {
  items: ArrayEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
}

export function ArrayEditingBreadcrumbs(props: ArrayEditingBreadcrumbsProps): JSX.Element | null {
  const {items: itemsProp = EMPTY_ARRAY, onPathSelect, selectedPath} = props

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

  const nodes = useMemo(() => {
    return items.map((item, index) => {
      const key = `${item}-${index}`
      const showSeparator = index < items.length - 1

      // If items are grouped in an array, those items are "collapsed" and should
      // be grouped in the same breadcrumbs menu button (i.e. the "..." button).
      if (Array.isArray(item)) {
        return (
          <Fragment key={key}>
            <ArrayEditingBreadcrumbsMenuButton
              button={
                <StyledButton mode="bleed" padding={1}>
                  <Flex overflow="hidden">
                    <StyledText size={1} weight="medium" textOverflow="ellipsis">
                      ...
                    </StyledText>
                  </Flex>
                </StyledButton>
              }
              collapsed
              items={item}
              onPathSelect={onPathSelect}
              parentElement={rootElement}
              selectedPath={selectedPath}
            />

            {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
          </Fragment>
        )
      }

      const isSelected = isEqual(item.path, selectedPath)

      return (
        <Fragment key={key}>
          <MenuButton item={item} isSelected={isSelected} onPathSelect={onPathSelect} />

          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Fragment>
      )
    })
  }, [items, selectedPath, onPathSelect, rootElement])

  return (
    <Flex align="center" as="ol" gap={2} ref={setRootElement}>
      {nodes}
    </Flex>
  )
}
