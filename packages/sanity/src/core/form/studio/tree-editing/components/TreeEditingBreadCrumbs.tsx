import {Box, Button, Flex, Stack, Text, Tooltip, useElementSize} from '@sanity/ui'
import {
  type ForwardedRef,
  forwardRef,
  Fragment,
  type PropsWithChildren,
  useMemo,
  useState,
} from 'react'
import {type Path} from 'sanity'
import styled from 'styled-components'

import {type TreeEditingBreadcrumb} from '../types'

const EMPTY_ARRAY: [] = []
const MAX_LENGTH = 5
const SEPARATOR = '/'

const RootFlex = styled(Flex)`
  width: 100%;
`

const SeparatorBox = styled(Box)`
  min-width: max-content;
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

const renderItem = (item: TreeEditingBreadcrumb, index: number, isSelected?: boolean) => {
  const weight = isSelected ? 'bold' : 'medium'

  return (
    <Box as="li" key={`${item.title}-${index}`}>
      <Text textOverflow="ellipsis" size={1} weight={weight}>
        {item.title}
      </Text>
    </Box>
  )
}

interface TreeEditingBreadCrumbsProps {
  items: TreeEditingBreadcrumb[]
  onPathSelect: (path: Path) => void
}

export function TreeEditingBreadCrumbs(props: TreeEditingBreadCrumbsProps): JSX.Element | null {
  const {items: itemsProp = EMPTY_ARRAY, onPathSelect} = props

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
      const isLast = index === items.length - 1

      if (Array.isArray(item)) {
        return (
          <Fragment key={key}>
            <Tooltip
              content={
                <Stack space={2} padding={2}>
                  {item.map((i) => renderItem(i, index, false))}
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

      return (
        <Fragment key={key}>
          <Button
            mode="bleed"
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => onPathSelect(item.path)}
            padding={1}
          >
            {renderItem(item, index, isLast)}
          </Button>

          {showSeparator && <SeparatorItem>{SEPARATOR}</SeparatorItem>}
        </Fragment>
      )
    })
  }, [items, onPathSelect])

  return (
    <RootFlex align="center" forwardedAs="ol" gap={2} ref={setRootElement}>
      {nodes}
    </RootFlex>
  )
}
