import {
  Flex,
  Hotkeys,
  Stack,
  Text,
  MenuItem as UIMenuItem,
  MenuItemProps as UIMenuItemProps,
} from '@sanity/ui'
import React, {createElement, forwardRef, isValidElement, useMemo} from 'react'
import {isValidElementType} from 'react-is'

const FONT_SIZE = 1

/** @internal */
export type MenuItemProps = Pick<
  UIMenuItemProps,
  'as' | 'icon' | 'iconRight' | 'pressed' | 'selected' | 'text' | 'tone'
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'children' | 'ref' | 'selected'> & {
    hotkeys?: UIMenuItemProps['hotkeys']
    /** Add wrappers to the menu item, e.g. `Tooltip`. */
    renderMenuItem?: (menuItem: React.JSX.Element) => React.ReactNode
    subtitle?: string
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
  {hotkeys, icon, iconRight, subtitle, text, ...props}: MenuItemProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    return (
      <Flex as="span" gap={3} align="center">
        {icon && (
          <Text align="center" size={FONT_SIZE}>
            {isValidElement(icon) && icon}
            {isValidElementType(icon) && createElement(icon)}
          </Text>
        )}

        <Stack flex={1} space={2}>
          <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
            {text}
          </Text>
          {subtitle && (
            <Text size={FONT_SIZE} textOverflow="ellipsis" weight="regular" muted>
              {subtitle}
            </Text>
          )}
        </Stack>

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
  }, [hotkeys, icon, iconRight, subtitle, text])

  return (
    <UIMenuItem ref={ref} {...props}>
      {typeof props.renderMenuItem === 'function'
        ? props.renderMenuItem(menuItemContent)
        : menuItemContent}
    </UIMenuItem>
  )
})
