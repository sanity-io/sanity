import {
  Flex,
  MenuItem as UIMenuItem,
  MenuItemProps as UIMenuItemProps,
  Stack,
  Text,
  Badge,
} from '@sanity/ui'
import React, {createElement, forwardRef, isValidElement, useMemo} from 'react'
import {isValidElementType} from 'react-is'

/** @internal */
export type PreviewMenuItemProps = Pick<
  UIMenuItemProps,
  'as' | 'iconRight' | 'pressed' | 'selected' | 'text' | 'tone'
> &
  Omit<React.HTMLProps<HTMLDivElement>, 'as' | 'children' | 'ref' | 'selected'> & {
    badge?: string
    preview: React.ReactNode
    subtitle?: string
    /** Add wrappers to the menu item, e.g. `Tooltip`. */
    renderMenuItem?: (menuItem: React.JSX.Element) => React.ReactNode
  }

const FONT_SIZE = 1

/**
 * Studio UI <MenuItem>.
 *
 * Studio UI components are opinionated `@sanity/ui` components meant for internal use only.
 * Props and options are intentionally limited to ensure consistency and ease of use.
 *
 * @internal
 */
export const PreviewMenuItem = forwardRef(function MenuItem(
  {preview: avatar, badge, iconRight, subtitle, text, ...props}: PreviewMenuItemProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    return (
      <Flex as="span" gap={3} align="center">
        {avatar && avatar}

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

        {badge && <Badge>{badge}</Badge>}

        {iconRight && (
          <Text size={FONT_SIZE}>
            {isValidElement(iconRight) && iconRight}
            {isValidElementType(iconRight) && createElement(iconRight)}
          </Text>
        )}
      </Flex>
    )
  }, [avatar, text, subtitle, badge, iconRight])

  return (
    <UIMenuItem ref={ref} {...props}>
      {typeof props.renderMenuItem === 'function'
        ? props.renderMenuItem(menuItemContent)
        : menuItemContent}
    </UIMenuItem>
  )
})
