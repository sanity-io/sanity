import {
  Flex,
  MenuItem as UIMenuItem,
  MenuItemProps as UIMenuItemProps,
  Box,
  Text,
  Badge,
  Stack,
  Hotkeys,
} from '@sanity/ui'
import React, {createElement, forwardRef, isValidElement, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'

interface LargeMenuItem {
  size: 'large'
  subText?: string
  badgeText?: string
  preview?: React.ReactNode
  /**
   * Hotkeys are only supported in `size="small"` menu items.
   */
  hotkeys?: undefined
  /**
   * Icon is only supported in `size="small"` menu items.
   */
  icon?: undefined
}

interface SmallMenuItem {
  size?: 'small'
  hotkeys?: UIMenuItemProps['hotkeys']
  /**
   * Sub text is only supported in `size="large"` menu items.
   */
  subText?: undefined
  /**
   * Badge text is only supported in `size="large"` menu items.
   */
  badgeText?: undefined
  /**
   * preview is only supported in `size="large"` menu items.
   */
  preview?: undefined
}

const FONT_SIZE = 1

/** @internal */
export type MenuItemProps = Pick<
  UIMenuItemProps,
  'as' | 'icon' | 'iconRight' | 'pressed' | 'selected' | 'text' | 'tone'
> &
  (LargeMenuItem | SmallMenuItem) &
  Omit<
    React.HTMLProps<HTMLDivElement>,
    'as' | 'height' | 'ref' | 'selected' | 'tabIndex' | 'size'
  > & {
    /**
     * Allows to add wrappers to the menu item, e.g. `Tooltip`.
     */
    renderMenuItem?: (menuItem: React.JSX.Element) => React.ReactNode
    /**
     * Usage of `children` is not recommended but still supported.
     * Try using `renderMenuItem` instead.
     * To use children opt out with `@ts-ignore`.
     */
    children?: undefined
  }

const PreviewWrapper = styled.div`
  width: 41px;
  height: 41px;
  display: flex;
  align-items: center;
  justify-content: center;
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
    size = 'small',
    badgeText,
    subText,
    text,
    preview = null,
    icon,
    iconRight,
    hotkeys,
    children,
    ...props
  }: MenuItemProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    if (size === 'large') {
      return (
        <Flex gap={3} align="center">
          {preview && <PreviewWrapper>{preview}</PreviewWrapper>}
          {(text || subText) && (
            <Stack flex={1} space={2}>
              {text && (
                <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
                  {text}
                </Text>
              )}
              {subText && (
                <Text size={FONT_SIZE} textOverflow="ellipsis" weight={'regular'} muted>
                  {subText}
                </Text>
              )}
            </Stack>
          )}
          {badgeText && (
            <Badge fontSize={FONT_SIZE} mode="default">
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
      )
    }

    return (
      <Flex as="span" gap={3} align="center">
        {icon && (
          <Text size={FONT_SIZE}>
            {isValidElement(icon) && icon}
            {isValidElementType(icon) && createElement(icon)}
          </Text>
        )}

        {text && (
          <Box flex={1}>
            <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
              {text}
            </Text>
          </Box>
        )}

        {hotkeys && (
          <Hotkeys fontSize={FONT_SIZE} keys={hotkeys} style={{marginTop: -4, marginBottom: -4}} />
        )}

        {iconRight && (
          <Text size={FONT_SIZE}>
            {isValidElement(iconRight) && iconRight}
            {isValidElementType(iconRight) && createElement(iconRight)}
          </Text>
        )}
      </Flex>
    )
  }, [size, icon, text, hotkeys, iconRight, preview, subText, badgeText])

  return (
    <UIMenuItem ref={ref} {...props}>
      {/* Not recommended, should opt out with ts-ignore to use it. */}
      {typeof children !== 'undefined' && children}
      {typeof children === 'undefined' && typeof props.renderMenuItem === 'function'
        ? props.renderMenuItem(menuItemContent)
        : menuItemContent}
    </UIMenuItem>
  )
})
