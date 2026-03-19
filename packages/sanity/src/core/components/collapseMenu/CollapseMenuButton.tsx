import {
  type ElementType,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  type ReactNode,
} from 'react'

import {Button, type ButtonProps} from '../../../ui-components/button/Button'
import type {TooltipProps} from '../../../ui-components/tooltip/Tooltip'

/** @internal */
export interface CommonProps extends Omit<ButtonProps, 'text' | 'iconRight'> {
  as?: ElementType | keyof React.JSX.IntrinsicElements
  dividerBefore?: boolean
  focused?: boolean
  tooltipProps?: TooltipProps
  tooltipText?: ReactNode
}

/** @internal */
export interface CollapseMenuButtonProps extends CommonProps {
  collapsedProps?: Omit<CommonProps, 'text'>
  expandedProps?: CommonProps
  text: string
}

/** @internal */
export const CollapseMenuButton = forwardRef(function CollapseMenuButton(
  props: CollapseMenuButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {
    // oxlint-disable-next-line no-unused-vars
    collapsedProps,
    // oxlint-disable-next-line no-unused-vars
    expandedProps,
    // oxlint-disable-next-line no-unused-vars
    tooltipProps,
    // oxlint-disable-next-line no-unused-vars
    tooltipText,
    // oxlint-disable-next-line no-unused-vars
    dividerBefore,
    ...rest
  } = props

  return <Button data-ui="CollapseMenuButton" {...rest} ref={ref} />
})
