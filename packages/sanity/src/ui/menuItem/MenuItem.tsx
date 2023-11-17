/* eslint-disable no-restricted-imports */
import {
  Flex,
  MenuItem as UIMenuItem,
  MenuItemProps as UIMenuItemProps,
  Text,
  Badge,
  Stack,
  Hotkeys,
} from '@sanity/ui'
import React, {createElement, forwardRef, isValidElement, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'

const FONT_SIZE = 1

/** @internal */
export type MenuItemProps = Pick<
  UIMenuItemProps,
  'as' | 'icon' | 'iconRight' | 'pressed' | 'selected' | 'text' | 'tone' | 'hotkeys'
> &
  Omit<
    React.HTMLProps<HTMLDivElement>,
    'as' | 'height' | 'ref' | 'selected' | 'tabIndex' | 'size'
  > & {
    subtitle?: string
    badgeText?: string
    /**
     * Max allowed size is 41x41.
     */
    preview?: React.ReactNode
    /**
     * Allows to add wrappers to the menu item, e.g. `Tooltip`.
     */
    renderMenuItem?: (menuItem: React.JSX.Element) => React.ReactNode
    /**
     * Usage of `children` is not supported, import `MenuItem` from `@sanity/ui` instead.
     */
    children?: undefined
  }

const PreviewWrapper = styled.div`
  width: 41px;
  height: 41px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`
/**
 * Studio UI <MenuItem>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const MenuItem = forwardRef(function MenuItem(
  {
    badgeText,
    subtitle,
    text,
    preview = null,
    icon,
    iconRight,
    hotkeys,
    children,
    renderMenuItem,
    ...rest
  }: MenuItemProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    return (
      <Flex gap={3} align="center">
        {icon && (
          <Text size={FONT_SIZE}>
            {isValidElement(icon) && icon}
            {isValidElementType(icon) && createElement(icon)}
          </Text>
        )}

        {preview && <PreviewWrapper>{preview}</PreviewWrapper>}

        {(text || subtitle) && (
          <Stack flex={1} space={2}>
            {text && (
              <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
                {text}
              </Text>
            )}
            {subtitle && (
              <Text size={FONT_SIZE} textOverflow="ellipsis" weight={'regular'} muted>
                {subtitle}
              </Text>
            )}
          </Stack>
        )}

        {(badgeText || hotkeys || iconRight) && (
          <Flex gap={3} marginLeft={3}>
            {hotkeys && (
              <Hotkeys
                fontSize={FONT_SIZE}
                keys={hotkeys}
                style={{marginTop: -4, marginBottom: -4}}
              />
            )}

            {badgeText && (
              <Badge fontSize={FONT_SIZE} mode="outline">
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
  }, [icon, text, hotkeys, iconRight, preview, subtitle, badgeText])

  return (
    <UIMenuItem ref={ref} {...rest}>
      {typeof children === 'undefined' && typeof renderMenuItem === 'function'
        ? renderMenuItem(menuItemContent)
        : menuItemContent}
    </UIMenuItem>
  )
})
