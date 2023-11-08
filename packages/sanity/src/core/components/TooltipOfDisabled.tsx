import React, {forwardRef} from 'react'
import {
  Tooltip, // eslint-disable-line no-restricted-imports
  TooltipProps, // eslint-disable-line no-restricted-imports
} from '@sanity/ui'

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
