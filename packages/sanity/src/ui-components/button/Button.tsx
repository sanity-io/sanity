/* eslint-disable no-restricted-imports */

import {
  Button as UIButton,
  type ButtonElementType,
  type ButtonProps as UIButtonProps,
  type Props,
} from '@sanity/ui'
import {styled} from 'styled-components'

import {Tooltip, type TooltipProps} from '../tooltip'

type BaseButtonProps = Pick<
  UIButtonProps<'button'>,
  | 'fontSize'
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
  as?: ButtonElementType
  size?: 'default' | 'large'
  radius?: 'full'
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

type ButtonOwnProps = BaseButtonProps & (ButtonWithText | IconButton)

/** @internal */
export type ButtonProps<E extends ButtonElementType = 'button'> = Props<ButtonOwnProps, E>

const LARGE_BUTTON_PROPS: UIButtonProps = {
  space: 3,
  padding: 3,
}
const DEFAULT_BUTTON_PROPS: UIButtonProps = {
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
export function Button<E extends ButtonElementType = 'button'>(props: ButtonProps<E>) {
  const {
    as = 'button',
    size = 'default',
    mode = 'default',
    paddingY,
    tone = 'default',
    tooltipProps,
    ...rest
  } = props as ButtonProps<'button'>
  const sizeProps = size === 'default' ? DEFAULT_BUTTON_PROPS : LARGE_BUTTON_PROPS
  const children = (
    <UIButton {...rest} {...sizeProps} as={as} paddingY={paddingY} mode={mode} tone={tone} />
  )

  if (tooltipProps) {
    return (
      <Tooltip content={tooltipProps?.content} portal {...tooltipProps}>
        {/* This span is needed to make the tooltip work in disabled buttons */}
        <TooltipButtonWrapper>{children}</TooltipButtonWrapper>
      </Tooltip>
    )
  }

  return children
}
