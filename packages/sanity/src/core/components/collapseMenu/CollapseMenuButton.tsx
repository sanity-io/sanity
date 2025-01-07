import {
  type ElementType,
  type ForwardedRef,
  forwardRef,
  type HTMLProps,
  type ReactNode,
} from 'react'

import {Button, type ButtonProps, type TooltipProps} from '../../../ui-components'

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collapsedProps = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    expandedProps = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tooltipProps = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tooltipText,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dividerBefore,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...rest
  } = props

  return <Button data-ui="CollapseMenuButton" {...rest} ref={ref} />
})
