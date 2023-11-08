import {
  Flex,
  Hotkeys,
  Text,
  Tooltip, // eslint-disable-line no-restricted-imports
  TooltipProps, // eslint-disable-line no-restricted-imports
  useTheme,
} from '@sanity/ui'
import React, {useMemo, HTMLProps, forwardRef, ForwardedRef, ReactNode} from 'react'
import styled from 'styled-components'
import {Button, ButtonProps} from '../../ui'

/** @hidden @beta */
export interface StatusButtonProps extends Omit<ButtonProps, 'iconRight'> {
  disabled?: boolean | {reason: ReactNode}
  hotkey?: string[]
  label?: string
  mode?: ButtonProps['mode']
  tooltip?: Omit<TooltipProps, 'content' | 'disabled' | 'portal'>
}

const ButtonWrapper = styled.div({
  position: 'relative',
})

const Dot = styled.div({
  position: 'absolute',
  top: 6,
  right: 6,
  width: 4,
  height: 4,
  borderRadius: 3,
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})

/** @hidden @beta */
export const StatusButton = forwardRef(function StatusButton(
  props: StatusButtonProps & Omit<HTMLProps<HTMLButtonElement>, 'disabled' | 'ref' | 'size'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {
    disabled: disabledProp,
    hotkey,
    icon,
    label,
    mode = 'bleed',
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
    <Tooltip placement="bottom" {...tooltip} content={tooltipContent} disabled={!label} portal>
      <ButtonWrapper>
        <Button
          data-ui="StatusButton"
          {...restProps}
          aria-label={label}
          disabled={disabled}
          mode={mode}
          ref={ref}
          text={text}
          icon={icon}
        />
        {tone && <Dot style={dotStyle} />}
      </ButtonWrapper>
    </Tooltip>
  )
})
