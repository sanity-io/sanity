import {Box, Card, CardTone, Flex, Stack} from '@sanity/ui'
import React, {ReactNode, useRef} from 'react'
import styled from 'styled-components'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {DragHandle} from '../common/DragHandle'
import {MOVING_ITEM_CLASS_NAME} from '../common/list'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  focused?: boolean
  presence?: ReactNode
  validation?: ReactNode
  menu?: ReactNode
  footer?: ReactNode
  selected?: boolean
  children?: ReactNode
}

const Root = styled(Card)`
  position: relative;
  border: 1px solid transparent;
  transition: border-color 250ms;

  .${MOVING_ITEM_CLASS_NAME} & {
    border-color: var(--card-shadow-umbra-color);
    box-shadow:
      0 0 0 0,
      0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }

  &:hover {
    border-color: var(--card-shadow-umbra-color);
  }

  &[aria-selected='true'] {
    border-color: var(--card-focus-ring-color);
  }
`

export function RowLayout(props: RowLayoutProps) {
  const {validation, selected, tone, presence, focused, children, dragHandle, menu, footer} = props

  const elementRef = useRef<HTMLDivElement | null>(null)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      elementRef.current?.focus()
    }
  })

  return (
    <Root
      ref={elementRef}
      selected={selected}
      aria-selected={selected}
      radius={2}
      padding={1}
      tone={tone}
    >
      <Stack space={1}>
        <Flex align="center">
          {dragHandle && (
            <Box marginRight={1} paddingY={1}>
              <DragHandle size="small" />
            </Box>
          )}

          <Box flex={1}>{children}</Box>

          {(presence || validation || menu) && (
            <Flex align="center" marginLeft={1}>
              {presence && <Box marginLeft={1}>{presence}</Box>}
              {validation && <Box marginLeft={1}>{validation}</Box>}
              {menu}
            </Flex>
          )}
        </Flex>
        {footer}
      </Stack>
    </Root>
  )
}
