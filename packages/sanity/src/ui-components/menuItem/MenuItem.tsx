/* eslint-disable no-restricted-imports */
import {
  Badge,
  Box,
  Flex,
  Hotkeys,
  MenuItem as UIMenuItem,
  type MenuItemProps as UIMenuItemProps,
  Stack,
  Text,
} from '@sanity/ui'
import type * as React from 'react'
import {createElement, forwardRef, isValidElement, useCallback, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'

import {Tooltip, type TooltipProps} from '..'
import {
  ConditionalWrapper,
  type ConditionalWrapperRenderWrapperCallback,
} from '../conditionalWrapper'

const FONT_SIZE = 1
const SUBTITLE_FONT_SIZE = 0

const SubtitleText = styled(Text)`
  margin-top: 2px;
`

/** @internal */
export type MenuItemProps = Pick<
  UIMenuItemProps,
  'as' | 'icon' | 'iconRight' | 'pressed' | 'selected' | 'text' | 'tone' | 'hotkeys'
> & {
  badgeText?: string
  /**
   * Usage of `children` is not supported, import `MenuItem` from `@sanity/ui` instead.
   */
  children?: undefined
  /**
   * Previews should be 25x25.
   */
  preview?: React.ReactNode
  /**
   * Optional render callback which receives menu item content.
   */
  renderMenuItem?: (menuItemContent: React.JSX.Element) => React.ReactNode
  tooltipProps?: TooltipProps | null
  /**
   * Optional subtitle prop for the menu item.
   * It is not recommended, but it is used for the workspace menu button.
   */
  subtitle?: string
  /**
   * Optional space prop for the menu item.
   * It is not recommended, but it is used for the workspace menu button.
   * This is the space between the icon and the text in the preview component.
   */
  space?: boolean
}

const PreviewWrapper = styled(Box)`
  height: 25px;
  width: 25px;
  overflow: hidden;
`

/**
 * Customized Sanity UI <MenuItem> that restricts usage of `children` to encourage simple,
 * single line menu items.
 *
 * The workspace menu button needed a subtitle - hence, the StudioUI MenuIten now takes a subtitle prop.
 * This is only an escape hatch for the workspace menu button and is not recommended for general use.
 *
 * It also accepts a prop to attach tooltips as well as custom badges too.
 *
 * @internal
 */
export const MenuItem = forwardRef(function MenuItem(
  {
    badgeText,
    children: childrenProp,
    disabled,
    hotkeys,
    icon,
    iconRight,
    preview = null,
    renderMenuItem,
    text,
    tooltipProps,
    subtitle,
    space = false,
    ...rest
  }: MenuItemProps &
    Omit<
      React.HTMLProps<HTMLDivElement>,
      'as' | 'height' | 'ref' | 'selected' | 'tabIndex' | 'size'
    >,
  ref: React.Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    return (
      <Flex align="center" gap={2}>
        {preview && (
          <PreviewWrapper
            style={{opacity: disabled ? 0.25 : undefined, paddingRight: space ? '4px' : '0'}}
          >
            <Flex align="center" height="fill" justify="center">
              {preview}
            </Flex>
          </PreviewWrapper>
        )}
        {icon && (
          <Box paddingRight={1}>
            <Text size={FONT_SIZE}>
              {isValidElement(icon) && icon}
              {isValidElementType(icon) && createElement(icon)}
            </Text>
          </Box>
        )}
        {text && (
          <Stack flex={1} space={subtitle ? 1 : 2} paddingLeft={subtitle ? 1 : 0}>
            <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
              {text}
            </Text>
            {subtitle && (
              <SubtitleText size={SUBTITLE_FONT_SIZE} textOverflow="ellipsis" weight="medium" muted>
                {subtitle}
              </SubtitleText>
            )}
          </Stack>
        )}
        {(badgeText || hotkeys || iconRight) && (
          <Flex align="center" gap={3} marginLeft={3}>
            {hotkeys && <Hotkeys keys={hotkeys} style={{marginTop: -4, marginBottom: -4}} />}

            {badgeText && (
              <Badge fontSize={0} style={{marginTop: -4, marginBottom: -4}}>
                {badgeText}
              </Badge>
            )}

            {iconRight && (
              <Text size={FONT_SIZE}>
                {isValidElement(iconRight) && iconRight}
                {isValidElementType(iconRight) && createElement(iconRight)}
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    )
  }, [badgeText, disabled, hotkeys, icon, iconRight, preview, text, subtitle, space])

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
      <UIMenuItem
        disabled={disabled}
        paddingLeft={preview ? 1 : 3}
        paddingRight={3}
        paddingY={preview ? 1 : 3}
        ref={ref}
        {...rest}
      >
        {typeof childrenProp === 'undefined' && typeof renderMenuItem === 'function'
          ? renderMenuItem(menuItemContent)
          : menuItemContent}
      </UIMenuItem>
    </ConditionalWrapper>
  )
})
