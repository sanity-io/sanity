/* eslint-disable no-restricted-imports */
import {
  Badge,
  Box,
  Flex,
  MenuItem as UIMenuItem,
  type MenuItemProps as UIMenuItemProps,
  Stack,
  Text,
} from '@sanity/ui'
import {
  forwardRef,
  type HTMLProps,
  isValidElement,
  type ReactNode,
  type Ref,
  useCallback,
  useMemo,
} from 'react'
import {isValidElementType} from 'react-is'
import {styled} from 'styled-components'

import {Hotkeys} from '../../core/components/Hotkeys'
import {Tooltip, type TooltipProps} from '..'
import {
  ConditionalWrapper,
  type ConditionalWrapperRenderWrapperCallback,
} from '../conditionalWrapper'

const FONT_SIZE = 1
const SUBTITLE_FONT_SIZE = 0

/* Using px value here to make title/subtitles align with icon */
const SubtitleText = styled(Text)`
  margin-top: 2px;
`

/** @internal */
export type MenuItemProps = Pick<
  UIMenuItemProps,
  'as' | 'icon' | 'iconRight' | 'pressed' | 'selected' | 'tone' | 'hotkeys'
> & {
  badgeText?: string
  /**
   * Usage of `children` is not supported, import `MenuItem` from `@sanity/ui` instead.
   */
  children?: undefined
  /**
   * Previews should be 25x25.
   */
  preview?: ReactNode
  /**
   * Optional render callback which receives menu item content.
   */
  renderMenuItem?: (menuItemContent: React.JSX.Element) => ReactNode
  text?: string
  tooltipProps?: TooltipProps | null
  /**
   * Optional subtitle prop for the menu item.
   * While not recommended, it is utilized for the workspace menu button.
   */
  __unstable_subtitle?: string
  /**
   * An optional property to adjust spacing in the preview between the icon and the text.
   * Not recommended, but is applied to the workspace menu button..
   */
  __unstable_space?: number
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
    icon: Icon,
    iconRight: IconRight,
    preview = null,
    renderMenuItem,
    text,
    tooltipProps,
    __unstable_subtitle,
    __unstable_space,
    ...rest
  }: MenuItemProps &
    Omit<HTMLProps<HTMLDivElement>, 'as' | 'height' | 'ref' | 'selected' | 'tabIndex' | 'size'>,
  ref: Ref<HTMLDivElement>,
) {
  const menuItemContent = useMemo(() => {
    return (
      <Flex align="center" gap={2}>
        {preview && (
          <PreviewWrapper
            style={{opacity: disabled ? 0.25 : undefined}}
            paddingRight={__unstable_space ? 1 : 0}
          >
            <Flex align="center" height="fill" justify="center">
              {preview}
            </Flex>
          </PreviewWrapper>
        )}
        {Icon && (
          <Box paddingRight={1}>
            <Text size={FONT_SIZE}>
              {isValidElement(Icon) && Icon}
              {isValidElementType(Icon) && <Icon />}
            </Text>
          </Box>
        )}
        {text && (
          <Stack
            flex={1}
            space={__unstable_subtitle ? 1 : 2}
            paddingLeft={__unstable_subtitle ? 1 : 0}
          >
            <Text size={FONT_SIZE} textOverflow="ellipsis" weight="medium">
              {text}
            </Text>
            {__unstable_subtitle && (
              <SubtitleText size={SUBTITLE_FONT_SIZE} textOverflow="ellipsis" weight="medium" muted>
                {__unstable_subtitle}
              </SubtitleText>
            )}
          </Stack>
        )}
        {(badgeText || hotkeys || IconRight) && (
          <Flex align="center" gap={3} marginLeft={3}>
            {hotkeys && <Hotkeys keys={hotkeys} style={{marginTop: -4, marginBottom: -4}} />}

            {badgeText && (
              <Badge fontSize={0} style={{marginTop: -4, marginBottom: -4}}>
                {badgeText}
              </Badge>
            )}

            {IconRight && (
              <Text size={FONT_SIZE}>
                {isValidElement(IconRight) && IconRight}
                {isValidElementType(IconRight) && <IconRight />}
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    )
  }, [
    preview,
    disabled,
    __unstable_space,
    Icon,
    text,
    __unstable_subtitle,
    badgeText,
    hotkeys,
    IconRight,
  ])

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
