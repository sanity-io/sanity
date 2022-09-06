import {Button, ButtonProps, TooltipProps} from '@sanity/ui'
import React, {forwardRef} from 'react'

export type CommonProps = {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  dividerBefore?: boolean
  focused?: boolean
  tooltipProps?: TooltipProps
  tooltipText?: React.ReactNode
} & Omit<ButtonProps, 'text' | 'iconRight'>
export type CollapseMenuButtonProps = {
  collapsedProps?: Omit<CommonProps, 'text'>
  expandedProps?: CommonProps
} & CommonProps &
  Pick<ButtonProps, 'text'>

export const CollapseMenuButton = forwardRef(function CollapseMenuButton(
  props: CollapseMenuButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as'>,
  ref: React.ForwardedRef<HTMLButtonElement>
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
