import {ChevronDownIcon} from '@sanity/icons'
import {Box, Button, Flex, Stack, Text, Tooltip, useElementSize} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {isEqual} from 'lodash'
import {
  type ForwardedRef,
  forwardRef,
  Fragment,
  type PropsWithChildren,
  useMemo,
  useState,
} from 'react'
import {type Path} from 'sanity'
import styled, {css} from 'styled-components'

import {type TreeEditingBreadcrumb} from '../../types'
import {TreeEditingBreadcrumbsMenuButton} from './TreeEditingBreadcrumbsMenuButton'

const EMPTY_ARRAY: [] = []
const MAX_LENGTH = 5
const SEPARATOR = '/'

const RootFlex = styled(Flex)`
  width: 100%;
`

const SeparatorBox = styled(Box)`
  min-width: max-content;
`

const StyledButton = styled(Button)(({theme}: {theme: Theme}) => {
  const {bold} = theme.sanity.v2?.font.text?.weights || {}

  return css`
    max-height: 1rem;
    overflow: hidden;

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

interface TreeEditingBreadcrumbsProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
  selectedPath: Path
}

export function TreeEditingBreadcrumbs(props: TreeEditingBreadcrumbsProps): JSX.Element | null {
  const {items: itemsProp = EMPTY_ARRAY, onPathSelect, selectedPath} = props

  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const size = useElementSize(rootElement)

  // todo: evaluate if these values are working as expected
  // in various screen sizes
  const maxLength = useMemo(() => {
    const w = size?.border.width

    if (!w) return MAX_LENGTH
    if (w < 300) return 3
    if (w < 500) return 4
    if (w < 700) return 5

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

      if (Array.isArray(item)) {
        return (
          <Fragment key={key}>
            <Tooltip
              content={
                <Stack space={2} padding={2}>
                  {item.map((subItem) => (
                    <Box as="li" key={`${subItem.title}-${index}`}>
                      <Text textOverflow="ellipsis" size={1}>
                        {subItem.title}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              }
            >
              <SeparatorBox>
                <SeparatorItem>...</SeparatorItem>
              </SeparatorBox>
            </Tooltip>

            {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
          </Fragment>
        )
      }

      // We check if the length is greater than 1 as the root item
      // is also included in the children array.
      const hasChildren = item.children.length > 1

      const button = (
        <StyledButton
          data-active={isEqual(item.path, selectedPath) ? 'true' : 'false'}
          mode="bleed"
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => onPathSelect(item.path)}
          padding={1}
          space={2}
        >
          <Flex flex={1} align="center" justify="flex-start" gap={1} overflow="hidden">
            <StyledText size={1} muted weight="medium" textOverflow="ellipsis">
              {item.title}
            </StyledText>
            {hasChildren ? (
              <Text size={0}>
                <ChevronDownIcon />
              </Text>
            ) : undefined}
          </Flex>
        </StyledButton>
      )

      return (
        <Fragment key={key}>
          {!hasChildren && button}

          {hasChildren && (
            <TreeEditingBreadcrumbsMenuButton
              button={button}
              parentArrayTitle={item.parentArrayTitle}
              items={item.children}
              onPathSelect={onPathSelect}
              selectedPath={item.path}
            />
          )}

          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Fragment>
      )
    })
  }, [items, onPathSelect, selectedPath])

  return (
    <RootFlex align="center" forwardedAs="ol" gap={2} ref={setRootElement}>
      {nodes}
    </RootFlex>
  )
}
