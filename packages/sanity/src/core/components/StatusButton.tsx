import {type ForwardedRef, forwardRef, type HTMLProps, type ReactNode, useMemo} from 'react'
import {styled} from 'styled-components'

import {Button, type ButtonProps} from '../../ui-components'

/** @hidden @beta */
export type StatusButtonProps = ButtonProps & {
  ['aria-label']: HTMLProps<HTMLButtonElement>['aria-label']
  forwardedAs?: string
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
  const {
    'disabled': disabledProp,
    icon,
    'aria-label': label,
    mode = 'bleed',
    text,
    tone,
    ...restProps
  } = props

  const dotStyle = useMemo(() => ({backgroundColor: `var(--card-badge-${tone}-dot-color)`}), [tone])
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
