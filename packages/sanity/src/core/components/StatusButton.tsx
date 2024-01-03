import {useTheme} from '@sanity/ui'
import {useMemo, HTMLProps, forwardRef, ForwardedRef, ReactNode} from 'react'
import styled from 'styled-components'
import {Button, ButtonProps} from '../../ui-components'

/** @hidden @beta */
export type StatusButtonProps = ButtonProps & {
  disabled?: boolean | {reason: ReactNode}
  mode?: ButtonProps['mode']
  iconRight?: undefined
}

const StyledButton = styled(Button)`
  position: relative;
  // The children in button is rendered inside a span, we need to absolutely position it.
  & > span:nth-child(2) {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 0;
  }
`

const Dot = styled.div({
  width: 4,
  height: 4,
  borderRadius: 3,
  boxShadow: '0 0 0 1px var(--card-bg-color)',
})

/** @hidden @beta */
export const StatusButton = forwardRef(function StatusButton(
  props: StatusButtonProps &
    Omit<HTMLProps<HTMLButtonElement>, 'disabled' | 'ref' | 'size' | 'title'>,
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {disabled: disabledProp, icon, label, mode = 'bleed', text, tone, ...restProps} = props
  const theme = useTheme()
  const toneColor = tone && theme.sanity.color.solid[tone]
  const dotStyle = useMemo(() => ({backgroundColor: toneColor?.enabled.bg}), [toneColor])
  const disabled = Boolean(disabledProp)

  return (
    <StyledButton
      data-ui="StatusButton"
      {...restProps}
      aria-label={label}
      disabled={disabled}
      mode={mode}
      ref={ref}
      text={text}
      icon={icon}
    >
      {tone && <Dot style={dotStyle} />}
    </StyledButton>
  )
})
