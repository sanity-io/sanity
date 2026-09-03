import {clsx} from 'clsx'
import {type HTMLProps, type ReactNode, type RefAttributes, useMemo} from 'react'

import {Button, type ButtonProps} from '../../ui-components/button/Button'
import {dot, statusButton} from './StatusButton.css'

/** @hidden @beta */
export type StatusButtonProps = ButtonProps & {
  ['aria-label']: HTMLProps<HTMLButtonElement>['aria-label']
  'forwardedAs'?: string
  'disabled'?: boolean | {reason: ReactNode}
  'mode'?: ButtonProps['mode']
  'iconRight'?: undefined
}

/** @hidden @beta */
export function StatusButton(
  props: StatusButtonProps &
    Omit<HTMLProps<HTMLButtonElement>, 'disabled' | 'ref' | 'size' | 'title'> &
    RefAttributes<HTMLButtonElement>,
) {
  const {
    ref,
    className,
    disabled: disabledProp,
    'aria-label': label,
    mode = 'bleed',
    tone,
    // `text` and `icon` stay in `restProps` so the ButtonWithText | IconButton
    // union stays correlated when spread onto the button.
    ...restProps
  } = props

  const dotStyle = useMemo(() => ({backgroundColor: `var(--card-badge-${tone}-dot-color)`}), [tone])
  const disabled = Boolean(disabledProp)

  return (
    <Button
      data-ui="StatusButton"
      {...restProps}
      aria-label={label}
      className={clsx(statusButton, className)}
      disabled={disabled}
      mode={mode}
      ref={ref}
    >
      {tone && <div className={dot} style={dotStyle} />}
    </Button>
  )
}
