import {forwardRef} from 'react'

import {Tooltip, type TooltipProps} from '../../ui-components/tooltip/Tooltip'

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
