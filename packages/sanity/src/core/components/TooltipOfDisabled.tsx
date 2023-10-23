import React, {forwardRef} from 'react'
import {Tooltip, TooltipProps} from '../../ui'

/** @internal */
export const TooltipOfDisabled = forwardRef(function DisabledTooltip({
  children,
  content,
  disabled,
  ref,
  ...restProps
}: TooltipProps) {
  return (
    <Tooltip {...restProps} content={content} disabled={disabled || !content} ref={ref}>
      <div>{children}</div>
    </Tooltip>
  )
})
