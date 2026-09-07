import {Card, type CardTone, Stack} from '@sanity/ui'
import {type ReactNode, useRef} from 'react'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

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
  readOnly: boolean
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
    <Root
      ref={elementRef}
      selected={selected}
      aria-selected={selected}
      radius={1}
      padding={1}
      tone={tone}
    >
      <Stack gap={1}>
        <Flex alignItems="center" gap={1}>
          {dragHandle && <DragHandle paddingY={3} readOnly={readOnly} />}

          <Box flexBasis="0%" flexGrow={1}>
            {children}
          </Box>

          {(presence || validation || menu) && (
            <Flex
              alignItems="center"
              flexBasis="auto"
              flexGrow={0}
              flexShrink={0}
              gap={2}
              style={{lineHeight: 0}}
            >
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
    </Root>
  )
}
