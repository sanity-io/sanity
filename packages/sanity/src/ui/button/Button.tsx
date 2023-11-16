/* eslint-disable no-restricted-imports */
import {Button as UIButton, ButtonProps as UIButtonProps} from '@sanity/ui'
import React, {forwardRef} from 'react'
import styled from 'styled-components'
import {Tooltip, TooltipProps} from '..'

type BaseButtonProps = Pick<
  UIButtonProps,
  | 'as'
  | 'icon'
  | 'iconRight'
  | 'justify'
  | 'loading'
  | 'mode'
  | 'selected'
  | 'tone'
  | 'type'
  | 'width'
> & {
  size?: 'default' | 'small'
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

const DEFAULT_BUTTON_PROPS = {
  space: 3,
  padding: 3,
}
const SMALL_BUTTON_PROPS = {
  space: 2,
  padding: 2,
}

const TooltipButtonWrapper = styled.span`
  display: inline-flex;
`
/**
 * Studio UI <Button>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const Button = forwardRef(function Button(
  {
    size = 'default',
    mode = 'default',
    tone = 'default',
    tooltipProps,
    ...props
  }: ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'size' | 'title'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
  if (tooltipProps) {
    return (
      <Tooltip
        // Force the tooltip to render in portal
        portal
        {...tooltipProps}
      >
        {/* This span is needed to make the tooltip work in disabled buttons */}
        <TooltipButtonWrapper>
          <UIButton
            // aria-label is enforced in buttons without text.
            // Could be overridden by passing aria-label directly.
            aria-label={props.text ? undefined : tooltipProps.content ?? ''}
            {...props}
            {...(size === 'default' ? DEFAULT_BUTTON_PROPS : SMALL_BUTTON_PROPS)}
            ref={ref}
            mode={mode}
            tone={tone}
          />
        </TooltipButtonWrapper>
      </Tooltip>
    )
  }

  return (
    <UIButton
      {...props}
      {...(size === 'default' ? DEFAULT_BUTTON_PROPS : SMALL_BUTTON_PROPS)}
      ref={ref}
      mode={mode}
      tone={tone}
    />
  )
})
