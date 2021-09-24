import React from 'react'
import {Button, ButtonProps, ButtonTone, MenuItemProps, TooltipProps} from '@sanity/ui'

export type CollapseMenuButtonProps = Omit<ButtonProps, 'selected' | 'text' | 'icon' | 'iconRight'>

export interface CollapseMenuItemProps {
  as?: React.ElementType | keyof JSX.IntrinsicElements
  buttonProps?: CollapseMenuButtonProps
  collapseText?: boolean
  dividerBefore?: boolean
  icon: React.ComponentType | React.ReactNode
  menuItemProps?: Omit<MenuItemProps, 'pressed' | 'selected' | 'text' | 'icon' | 'iconRight'>
  selected?: boolean
  text: React.ReactNode
  tooltipProps?: Omit<TooltipProps, 'content'> & {text?: React.ReactNode}
  tone?: ButtonTone
}

export const CollapseMenuButton = React.forwardRef(function CollapseMenuButton(
  props: CollapseMenuItemProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'type'>,
  ref: React.ForwardedRef<HTMLButtonElement>
) {
  /**
   * We need to do this destructure in order to not get unwanted attributes in the DOM
   */
  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    buttonProps,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    collapseText,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    dividerBefore,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    menuItemProps,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    tooltipProps,
    ...restProps
  } = props

  return <Button {...restProps} ref={ref} data-ui="CollapseMenuButton" />
})
