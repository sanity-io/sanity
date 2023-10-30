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

interface LargeMenuItem {
  size: 'large'
  subText?: string
  badgeText?: string
  avatar?: React.ReactNode
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
   * Avatar is only supported in `size="large"` menu items.
   */
  avatar?: undefined
}

const fontSize = 1

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
    avatar = null,
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
          {avatar}
          {(text || subText) && (
            <Stack flex={1} space={2}>
              {text && (
                <Text size={fontSize} textOverflow="ellipsis" weight="medium">
                  {text}
                </Text>
              )}
              {subText && (
                <Text size={fontSize} textOverflow="ellipsis" weight={'regular'} muted>
                  {subText}
                </Text>
              )}
            </Stack>
          )}
          {badgeText && (
            <Badge fontSize={fontSize} mode="default">
              {badgeText}
            </Badge>
          )}
        </Flex>
      )
    }

    return (
      <Flex as="span" gap={3} align="center">
        {icon && (
          <Text size={fontSize}>
            {isValidElement(icon) && icon}
            {isValidElementType(icon) && createElement(icon)}
          </Text>
        )}

        {text && (
          <Box flex={1}>
            <Text size={fontSize} textOverflow="ellipsis" weight="medium">
              {text}
            </Text>
          </Box>
        )}

        {hotkeys && (
          <Hotkeys fontSize={fontSize} keys={hotkeys} style={{marginTop: -4, marginBottom: -4}} />
        )}

        {iconRight && (
          <Text size={fontSize}>
            {isValidElement(iconRight) && iconRight}
            {isValidElementType(iconRight) && createElement(iconRight)}
          </Text>
        )}
      </Flex>
    )
  }, [size, icon, text, hotkeys, iconRight, avatar, subText, badgeText])

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
