import {
  Box,
  Button,
  ButtonMode,
  ButtonProps,
  Flex,
  Hotkeys,
  Text,
  Tooltip,
  TooltipProps,
  useTheme,
} from '@sanity/ui'
import React, {
  createElement,
  isValidElement,
  useMemo,
  HTMLProps,
  forwardRef,
  ForwardedRef,
  ReactNode,
} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'

/** @hidden @beta */
export interface StatusButtonProps extends Omit<ButtonProps, 'iconRight'> {
  disabled?: boolean | {reason: ReactNode}
  hotkey?: string[]
  label?: string
  mode?: ButtonMode
  tooltip?: Omit<TooltipProps, 'content' | 'disabled' | 'portal'>
}

const IconBox = styled(Box)({
  position: 'relative',
})

const Dot = styled.div({
  position: 'absolute',
  top: -4,
  right: -4,
  width: 6,
  height: 6,
  borderRadius: 3,
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})

/** @hidden @beta */
export const StatusButton = forwardRef(function StatusButton(
  props: StatusButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'disabled' | 'ref'>,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const {
    disabled: disabledProp,
    fontSize,
    hotkey,
    icon,
    label,
    mode = 'bleed',
    space = 3,
    text,
    tone,
    tooltip,
    ...restProps
  } = props
  const theme = useTheme()
  const toneColor = tone && theme.sanity.color.solid[tone]
  const dotStyle = useMemo(() => ({backgroundColor: toneColor?.enabled.bg}), [toneColor])
  const disabled = Boolean(disabledProp)

  const tooltipContent =
    typeof disabledProp === 'object' ? (
      <Text size={1}>{disabledProp.reason}</Text>
    ) : (
      <Flex align="center" gap={2} style={{lineHeight: 0}}>
        <Text size={1}>{label}</Text>
        {hotkey && <Hotkeys fontSize={0} keys={hotkey} style={{margin: -4}} />}
      </Flex>
    )

  return (
    <Tooltip
      padding={2}
      placement="bottom"
      {...tooltip}
      content={tooltipContent}
      disabled={!label}
      portal
    >
      <div>
        <Button
          data-ui="StatusButton"
          {...restProps}
          aria-label={label}
          disabled={disabled}
          mode={mode}
          ref={ref}
        >
          <Flex gap={space}>
            <IconBox>
              <Text size={fontSize}>
                {isValidElement(icon) && icon}
                {isValidElementType(icon) && createElement(icon)}
              </Text>
              {tone && <Dot style={dotStyle} />}
            </IconBox>
            {text && (
              <Box flex={1}>
                <Text size={fontSize}>{text}</Text>
              </Box>
            )}
          </Flex>
        </Button>
      </div>
    </Tooltip>
  )
})
