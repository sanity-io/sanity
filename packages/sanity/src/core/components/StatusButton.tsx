import {Box, Button, ButtonProps, Flex, Text, Tooltip, TooltipProps, useTheme} from '@sanity/ui'
import React, {
  createElement,
  isValidElement,
  useMemo,
  HTMLProps,
  forwardRef,
  ForwardedRef,
} from 'react'
import {isValidElementType} from 'react-is'
import styled from 'styled-components'

/** @beta */
export interface StatusButtonProps extends Omit<ButtonProps, 'iconRight'> {
  label?: string
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

/** @beta */
export const StatusButton = forwardRef(function StatusButton(
  props: StatusButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'ref'>,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const {fontSize, icon, label, space = 3, text, tone, tooltip, ...restProps} = props
  const theme = useTheme()
  const toneColor = tone && theme.sanity.color.solid[tone]
  const dotStyle = useMemo(() => ({backgroundColor: toneColor?.enabled.bg}), [toneColor])

  return (
    <Tooltip
      padding={2}
      placement="bottom"
      {...tooltip}
      content={<Text size={1}>{label}</Text>}
      disabled={!label}
      portal
    >
      <Button data-ui="StatusButton" {...restProps} aria-label={label} mode="bleed" ref={ref}>
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
    </Tooltip>
  )
})
