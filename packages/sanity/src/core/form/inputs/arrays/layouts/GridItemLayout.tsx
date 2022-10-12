import {Box, Card, CardTone, Flex} from '@sanity/ui'
import React, {ReactNode, useRef} from 'react'
import styled from 'styled-components'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {DragHandle} from '../common/DragHandle'

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

const FooterFlex = styled(Flex)`
  min-height: 35px;
`
const PresenceFlex = styled(Flex)`
  position: absolute;
  top: 0;
  right: 0;
  height: 35px;
`

const DragHandleCard = styled(Card)`
  position: absolute;
  top: 0;
  left: 0;
`
const Root = styled(Card)`
  transition: border-color 250ms;
  position: relative;

  @media (hover: hover) {
    ${DragHandleCard} {
      opacity: 0;
    }

    &:hover,
    &:focus-within {
      ${DragHandleCard} {
        opacity: 1;
      }
    }
  }

  &[aria-selected='true'] {
    box-shadow: 0 0 0 2px var(--card-focus-ring-color);
  }
`

export function GridItemLayout(props: RowLayoutProps) {
  const {validation, selected, tone, presence, focused, children, dragHandle, menu, footer} = props

  const elementRef = useRef<HTMLDivElement | null>(null)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      elementRef.current?.focus()
    }
  })

  return (
    <Root
      shadow={1}
      ref={elementRef}
      selected={selected}
      aria-selected={selected}
      radius={2}
      tone={tone}
    >
      {children}
      {dragHandle && (
        <DragHandleCard
          margin={1}
          radius={2}
          display="flex"
          tone="inherit"
          data-ui="DragHandleCard"
        >
          <DragHandle grid padding={2} mode="ghost" />
        </DragHandleCard>
      )}

      {presence && (
        <PresenceFlex align="center" marginX={1}>
          {presence}
        </PresenceFlex>
      )}
      <FooterFlex align="center" paddingX={1} sizing="border" justify="space-between">
        <Flex>{validation}</Flex>
        <Box>{footer}</Box>
        {menu}
      </FooterFlex>
    </Root>
  )
}
