import React, {ComponentProps} from 'react'
import {Card} from '@sanity/ui'
import styled from 'styled-components'
import {MOVING_ITEM_CLASS_NAME} from '../../../common/sortable'

const Root = styled(Card)`
  position: relative;
  border: 1px solid transparent;
  .dragHandle {
    color: var(--card-shadow-umbra-color);
  }
  &:hover {
    border-color: var(--card-shadow-umbra-color);
    .dragHandle {
      color: inherit;
    }
  }
  &[aria-selected='true'] {
    border-color: var(--card-focus-ring-color);
  }
  .${MOVING_ITEM_CLASS_NAME} & {
    box-shadow: 0 0 0 0, 0 8px 17px 2px var(--card-shadow-umbra-color),
      0 3px 14px 2px var(--card-shadow-penumbra-color),
      0 5px 5px -3px var(--card-shadow-ambient-color);
  }
`

export const RowWrapper = React.forwardRef(function RowWrapper(
  props: ComponentProps<typeof Card>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const {children, ...rest} = props
  return (
    <Root
      {...rest}
      ref={ref}
      tone={props.tone}
      /*prevent clicks in children from triggering onFocus on surrounding array input*/
      tabIndex={-1}
    >
      {children}
    </Root>
  )
})
