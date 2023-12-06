/* eslint-disable no-restricted-imports */
import {
  Box,
  Flex,
  MenuItem as UIMenuItem,
  MenuItemProps as UIMenuItemProps,
  Text,
  Badge,
  Stack,
  Hotkeys,
} from '@sanity/ui'
import React, {createElement, forwardRef, isValidElement, useCallback, useMemo} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'
import {ConditionalWrapper, ConditionalWrapperRenderWrapperCallback} from '../conditionalWrapper'
import {Tooltip, TooltipProps} from '..'

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
     * Allows to add wrappers to the menu item, e.g. `Tooltip`.
     */
    renderMenuItem?: (menuItem: React.JSX.Element) => React.ReactNode
    tooltipProps?: TooltipProps | null
  }

const PreviewWrapper = styled(Box)`
  height: 25px;
  width: 25px;
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
    children: childrenProp,
    hotkeys,
    icon,
    iconRight,
    preview = null,
    renderMenuItem,
    text,
    tooltipProps,
    ...rest
  }: MenuItemProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    return (
      <Flex align="center" gap={2}>
        {preview && (
          <PreviewWrapper>
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
          <Stack flex={1} space={2}>
            <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
              {text}
            </Text>
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
  }, [badgeText, hotkeys, icon, iconRight, preview, text])

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
