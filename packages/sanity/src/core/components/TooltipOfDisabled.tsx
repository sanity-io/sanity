import React, {forwardRef} from 'react'
import {Tooltip, TooltipProps} from '../../ui'

/** @internal */
export const TooltipOfDisabled = forwardRef<HTMLDivElement, TooltipProps>(function DisabledTooltip(
  {children, content, disabled, ...restProps},
  ref,
) {
  return (
    <Tooltip {...restProps} content={content} disabled={disabled || !content} ref={ref}>
      <div>{children}</div>
    </Tooltip>
  )
})
