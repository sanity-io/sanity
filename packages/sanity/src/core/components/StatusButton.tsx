import {vars} from '@sanity/ui/css'
import {type ForwardedRef, forwardRef, type HTMLProps, type ReactNode} from 'react'

import {Button, type ButtonProps} from '../../ui-components'
import * as styles from './StatusButton.css'

/** @hidden @beta */
export type StatusButtonProps = ButtonProps & {
  ['aria-label']: HTMLProps<HTMLButtonElement>['aria-label']
  forwardedAs?: string
  disabled?: boolean | {reason: ReactNode}
  mode?: ButtonProps['mode']
  iconRight?: undefined
}

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

  const disabled = Boolean(disabledProp)

  return (
    <Button
      className={styles.styledButton}
      data-ui="StatusButton"
      {...restProps}
      aria-label={label}
      disabled={disabled}
      mode={mode}
      ref={ref}
      text={text}
      icon={icon}
    >
      {tone && (
        <div className={styles.dot} style={{backgroundColor: vars.color.solid[tone].bg[0]}} />
      )}
    </Button>
  )
})
