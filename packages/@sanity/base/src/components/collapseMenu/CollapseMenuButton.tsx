import React, {createElement} from 'react'
import {Button, ButtonProps, ButtonTone, MenuItemProps, TooltipProps} from '@sanity/ui'

export interface CollapseMenuItemProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  buttonProps?: Omit<ButtonProps, 'selected' | 'text' | 'icon' | 'iconRight'>
  menuItemProps?: Omit<MenuItemProps, 'pressed' | 'selected' | 'text' | 'icon' | 'iconRight'>
  icon: React.ComponentType | React.ReactNode
  tone?: ButtonTone
  text: React.ReactNode
  selected?: boolean
  tooltipProps?: Omit<TooltipProps, 'content'>
}

export const CollapseMenuButton = React.forwardRef(function CollapseMenuButton(
  props: CollapseMenuItemProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'type'>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {buttonProps, menuItemProps, tooltipProps, ...restProps} = props

  return <Button {...restProps} ref={ref} data-ui="CollapseMenuButton" />
})
