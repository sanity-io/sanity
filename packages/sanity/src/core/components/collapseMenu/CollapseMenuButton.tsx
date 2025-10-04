import {type HTMLProps, type ReactNode} from 'react'

import {Button, type ButtonProps, type TooltipProps} from '../../../ui-components'

/** @internal */
export interface CommonProps extends Omit<ButtonProps<'button'>, 'text' | 'iconRight'> {
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
export function CollapseMenuButton(
  props: CollapseMenuButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
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

  return <Button data-ui="CollapseMenuButton" {...rest} />
}
