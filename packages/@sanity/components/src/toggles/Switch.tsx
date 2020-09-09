import React, {useEffect} from 'react'
import {useId} from '@reach/auto-id'
import {Marker} from '../types'
import styles from './Switch.css'
import sharedStyles from './shared.css'

interface SwitchProps {
  label?: string
  description?: string
  markers?: Marker[]
  readOnly?: boolean
}

export default React.forwardRef(function Switch(
  {
    disabled,
    markers,
    checked,
    label,
    description,
    readOnly,
    children,
    ...rest
  }: SwitchProps & Omit<React.HTMLProps<HTMLInputElement>, 'aria-described-by' | 'id' | 'type'>,
  ref: any
) {
  const elementId = useId()

  useEffect(() => {
    if (typeof checked === 'undefined' && ref?.current) {
      ref.current.indeterminate = true
    }
  }, [])

  return (
    <div className={styles.root}>
      <input
        {...rest}
        id={`switch-${elementId}-input`}
        aria-describedby={`switch-${elementId}-description`}
        className={styles.input}
        type="checkbox"
        disabled={disabled || readOnly}
        checked={checked}
        ref={ref}
      />
      <div className={styles.switchWrapper}>
        <div className={styles.track} />
        <div className={styles.thumb} />
      </div>
      {label && (
      <div className={sharedStyles.label}>
        <div className={sharedStyles.titleWrapper}>
          <label className={sharedStyles.title} htmlFor={`switch-${elementId}-input`}>
            {label}
          </label>
          {children}
        </div>
        {description && (
          <div id={`switch-${elementId}-description`} className={sharedStyles.description}>
            {description}
          </div>
        )}
      </div>
      )}
    </div>
  )
})
