/* eslint-disable no-restricted-imports */
import {Button as UIButton, ButtonProps as UIButtonProps} from '@sanity/ui'
import React, {forwardRef} from 'react'

/** @internal */
export type ButtonProps = Pick<
  UIButtonProps,
  | 'as'
  | 'icon'
  | 'iconRight'
  | 'justify'
  | 'loading'
  | 'mode'
  | 'selected'
  | 'text'
  | 'tone'
  | 'type'
  | 'width'
> & {
  size?: 'default' | 'small'
}

const DEFAULT_BUTTON_PROPS = {
  space: 3,
  padding: 3,
}
const SMALL_BUTTON_PROPS = {
  space: 2,
  padding: 2,
}
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
    ...props
  }: ButtonProps & Omit<React.HTMLProps<HTMLButtonElement>, 'as' | 'size'>,
  ref: React.ForwardedRef<HTMLButtonElement>,
) {
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
