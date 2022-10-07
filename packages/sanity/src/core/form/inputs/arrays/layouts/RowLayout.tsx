import {Box, Card, CardTone, Flex} from '@sanity/ui'
import React, {ReactNode, useRef} from 'react'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {DragHandle} from '../common/DragHandle'
import {ItemCard} from './ItemCard'

interface RowLayoutProps {
  tone?: CardTone
  dragHandle?: boolean
  focused?: boolean
  presence?: ReactNode
  validation?: ReactNode
  menu?: ReactNode
  selected?: boolean
  children?: ReactNode
}

export function RowLayout(props: RowLayoutProps) {
  const {validation, selected, tone, presence, focused, children, dragHandle, menu} = props

  const elementRef = useRef<HTMLDivElement | null>(null)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      elementRef.current?.focus()
    }
  })

  return (
    <ItemCard
      ref={elementRef}
      selected={selected}
      aria-selected={selected}
      radius={2}
      padding={1}
      /*prevent clicks in children from triggering onFocus on surrounding array input*/
      tabIndex={-1}
      tone={tone}
    >
      <Flex align="center">
        {dragHandle && (
          <Card tone="inherit" marginRight={1}>
            <DragHandle paddingX={1} paddingY={3} />
          </Card>
        )}

        <Box flex={1}>{children}</Box>

        <Flex align="center">
          {presence && <Box marginLeft={1}>{presence}</Box>}
          {validation && <Box marginLeft={1}>{validation}</Box>}
          {menu}
        </Flex>
      </Flex>
    </ItemCard>
  )
}
