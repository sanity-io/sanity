import {type RefAttributes} from 'react'

import {Tooltip, type TooltipProps} from '../../ui-components/tooltip/Tooltip'

/** @internal */
export function TooltipOfDisabled({
  ref,
  children,
  content,
  disabled,
  ...restProps
}: TooltipProps & RefAttributes<HTMLDivElement>) {
  return (
    <Tooltip {...restProps} content={content} disabled={disabled || !content} ref={ref}>
      <div>{children}</div>
    </Tooltip>
  )
}
