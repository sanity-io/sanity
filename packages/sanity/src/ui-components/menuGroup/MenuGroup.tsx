/* eslint-disable no-restricted-imports */
import {MenuGroup as UIMenuGroup, type MenuGroupProps as UIMenuGroupProps} from '@sanity/ui'
import {type HTMLProps, useCallback} from 'react'

import {
  ConditionalWrapper,
  type ConditionalWrapperRenderWrapperCallback,
} from '../conditionalWrapper/ConditionalWrapper'
import {Tooltip, type TooltipProps} from '../tooltip/Tooltip'

/** @internal */
export type MenuGroupProps = Pick<UIMenuGroupProps<'button'>, 'icon' | 'popover' | 'text' | 'tone'>

/**
 * Customized Sanity UI <MenuGroup> component with pre-defined layout options.
 *
 * @internal
 */
export const MenuGroup = (
  props: MenuGroupProps &
    Omit<
      HTMLProps<HTMLButtonElement>,
      'as' | 'height' | 'ref' | 'tabIndex' | 'popover' | 'type'
    > & {
      tooltipProps?: TooltipProps | null
    },
) => {
  const {tooltipProps} = props

  const renderWrapper = useCallback<ConditionalWrapperRenderWrapperCallback>(
    (children) => {
      return (
        <Tooltip content={tooltipProps?.content} portal {...tooltipProps}>
          {/* This div is needed to make the tooltip work in disabled menu items */}
          <div>{children}</div>
        </Tooltip>
      )
    },
    [tooltipProps],
  )

  return (
    <ConditionalWrapper condition={!!tooltipProps} wrapper={renderWrapper}>
      <UIMenuGroup {...props} fontSize={1} padding={3} />
    </ConditionalWrapper>
  )
}
