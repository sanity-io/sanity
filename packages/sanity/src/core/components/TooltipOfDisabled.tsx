import {Tooltip, TooltipProps} from '@sanity/ui'
import React, {ForwardedRef, forwardRef} from 'react'

/** @internal */
export const TooltipOfDisabled = forwardRef(function DisabledTooltip(
  props: TooltipProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {children, content, disabled, ...restProps} = props

  return (
    <Tooltip {...restProps} content={content} disabled={disabled || !content} padding={2} ref={ref}>
      <div>{children}</div>
    </Tooltip>
  )
})
