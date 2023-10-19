import React, {ForwardedRef, forwardRef} from 'react'
import {Tooltip, TooltipProps} from '../../ui' //ref error

/** @internal */
export const TooltipOfDisabled = forwardRef(function DisabledTooltip(
  props: TooltipProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const {children, content, disabled, ...restProps} = props

  return (
    <Tooltip {...restProps} content={content} disabled={disabled || !content} ref={ref}>
      <div>{children}</div>
    </Tooltip>
  )
})
