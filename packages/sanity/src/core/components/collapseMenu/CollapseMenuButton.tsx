import {type ForwardedRef, forwardRef, type HTMLProps, type ReactNode} from 'react'

import {Button, type ButtonProps, type TooltipProps} from '../../../ui-components'

/** @internal */
export interface CommonProps extends Omit<ButtonProps<'button'>, 'text' | 'iconRight'> {
  // as?: ButtonElementType
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
    collapsedProps = {},

    expandedProps = {},

    tooltipProps = {},

    tooltipText,

    dividerBefore,

    ...rest
  } = props

  return (
    <Button
      data-ui="CollapseMenuButton"
      {...rest}
      // @ts-expect-error - TODO: fix this
      ref={ref}
    />
  )
})
