/* eslint-disable no-restricted-imports */

import {Button as UIButton, ButtonProps as UIButtonProps} from '@sanity/ui'
import React, {forwardRef, useCallback} from 'react'
import styled from 'styled-components'
import {Tooltip, TooltipProps} from '..'
import {ConditionalWrapper, ConditionalWrapperRenderWrapperCallback} from '../conditionalWrapper'

type BaseButtonProps = Pick<
  UIButtonProps,
  | 'as'
  | 'icon'
  | 'iconRight'
  | 'justify'
  | 'loading'
  | 'mode'
  | 'paddingY'
  | 'selected'
  | 'tone'
  | 'type'
  | 'width'
> & {
  size?: 'default' | 'large'
}

type ButtonWithText = {
  text: string
  tooltipProps?: TooltipProps | null
  icon?: UIButtonProps['icon']
}

type IconButton = {
  text?: undefined
  icon?: UIButtonProps['icon']
  /**
   * When using a button with an icon, tooltipProps are required to enforce consistency in UI.
   */
  tooltipProps: TooltipProps | null
}

/** @internal */
export type ButtonProps = BaseButtonProps & (ButtonWithText | IconButton)

const LARGE_BUTTON_PROPS = {
  space: 3,
  padding: 3,
}
const DEFAULT_BUTTON_PROPS = {
  space: 2,
  padding: 2,
}

const TooltipButtonWrapper = styled.span`
  display: inline-flex;
`
/**
 * Customized Sanity UI <Button> with pre-defined layout options.
 *
 * @internal
 */
export const Button = forwardRef(function Button(
  {
    size = 'default',
    mode = 'default',
    paddingY,
    tone = 'default',
    tooltipProps,
    ...rest
  }: ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'size' | 'title'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  const renderWrapper = useCallback<ConditionalWrapperRenderWrapperCallback>(
    (children) => {
      return (
        <Tooltip content={tooltipProps?.content} portal {...tooltipProps}>
          {/* This span is needed to make the tooltip work in disabled buttons */}
          <TooltipButtonWrapper>{children}</TooltipButtonWrapper>
        </Tooltip>
      )
    },
    [tooltipProps],
  )

  const sizeProps = size === 'default' ? DEFAULT_BUTTON_PROPS : LARGE_BUTTON_PROPS

  return (
    <ConditionalWrapper condition={!!tooltipProps} wrapper={renderWrapper}>
      <UIButton {...rest} {...sizeProps} paddingY={paddingY} ref={ref} mode={mode} tone={tone} />
    </ConditionalWrapper>
  )
})
