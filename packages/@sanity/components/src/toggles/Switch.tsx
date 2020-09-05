import React, {useRef, useEffect} from 'react'
import {useId} from '@reach/auto-id'
import {Marker} from '../types'
import styles from './Switch.css'
import sharedStyles from './shared.css'

type Props = {
  label: string
  description: string
  markers: Marker[]
  checked: boolean
  disabled: boolean
  inputRef: React.RefObject<HTMLInputElement>
  readOnly: boolean
  children: any
  onFocus: () => void
  onBlur?: () => void
}

export default React.forwardRef(function Switch(
  {disabled, markers, checked, label, description, readOnly, children, onFocus, ...rest}: Props,
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
        onFocus={onFocus}
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
