import {RevertIcon} from '@sanity/icons'
import React, {forwardRef} from 'react'
import styled from 'styled-components'
import {Button, ButtonProps} from '../../../../ui'

const Root = styled(Button)`
  [data-ui='Text'] {
    font-weight: normal;
  }

  div[data-ui='Box'] {
    display: none;
  }

  &:not([data-disabled='true']):hover,
  &:not([data-disabled='true']):focus {
    --card-fg-color: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
    --card-bg-color: transparent;
    --card-border-color: transparent;

    div[data-ui='Box'] {
      display: block;
    }
  }
`

/** @internal */
export const RevertChangesButton = forwardRef(function RevertChangesButton(
  props: ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'ref'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
): React.ReactElement {
  const {selected, ...restProps} = props

  return (
    <Root
      icon={RevertIcon}
      selected={selected}
      text="Revert changes"
      mode="bleed"
      size="small"
      ref={ref}
      {...restProps}
    />
  )
})
