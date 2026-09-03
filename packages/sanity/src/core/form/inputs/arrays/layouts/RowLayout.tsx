import {Card, type CardTone, Flex, Stack} from '@sanity/ui'
import {type ReactNode, useRef} from 'react'
import {Box} from 'ui5'

import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {DragHandle} from '../common/DragHandle'
import {root} from './RowLayout.css'

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
  readOnly: boolean
}

export function RowLayout(props: RowLayoutProps) {
  const {
    validation,
    selected,
    tone,
    presence,
    focused,
    children,
    dragHandle,
    menu,
    footer,
    readOnly,
  } = props

  const elementRef = useRef<HTMLDivElement | null>(null)

  useDidUpdate(focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      elementRef.current?.focus()
    }
  })

  return (
    <Card
      className={root}
      ref={elementRef}
      selected={selected}
      aria-selected={selected}
      radius={1}
      padding={1}
      tone={tone}
    >
      <Stack gap={1}>
        <Flex align="center" gap={1}>
          {dragHandle && <DragHandle paddingY={3} readOnly={readOnly} />}

          <Box flexBasis="0%" flexGrow={1}>
            {children}
          </Box>

          {(presence || validation || menu) && (
            <Flex align="center" flex="none" gap={2} style={{lineHeight: 0}}>
              {presence && (
                <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
                  {presence}
                </Box>
              )}
              {validation && (
                <Box flexBasis="auto" flexGrow={0} flexShrink={0}>
                  {validation}
                </Box>
              )}
              {menu}
            </Flex>
          )}
        </Flex>
        {footer}
      </Stack>
    </Card>
  )
}
