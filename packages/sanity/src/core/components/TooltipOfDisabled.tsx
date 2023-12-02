import React, {forwardRef} from 'react'
import {TooltipWithNodes, TooltipWithNodesProps} from '../../ui'

/** @internal */
export const TooltipOfDisabled = forwardRef<HTMLDivElement, TooltipWithNodesProps>(
  function DisabledTooltip({children, content, disabled, ...restProps}, ref) {
    return (
      <TooltipWithNodes {...restProps} content={content} disabled={disabled || !content} ref={ref}>
        <div>{children}</div>
      </TooltipWithNodes>
    )
  },
)
