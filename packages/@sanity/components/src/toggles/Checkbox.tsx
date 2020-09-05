import React, {useEffect} from 'react'
import {useId} from '@reach/auto-id'
import {Marker} from '../types'
import styles from './Checkbox.css'
import sharedStyles from './shared.css'

type Props = {
  label: any
  description: string
  markers: Marker[]
  checked: boolean
  inputRef: React.RefObject<HTMLInputElement>
  disabled: boolean
  readOnly: boolean
  children: any
  onFocus: () => void
  onBlur?: () => void
}

export default React.forwardRef(function Checkbox(
  {
    label,
    description,
    markers,
    checked,
    disabled,
    readOnly,
    children,
    onFocus,
    onBlur,
    ...rest
  }: Props,
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
        id={`checkbox-${elementId}-input`}
        aria-describedby={`checkbox-${elementId}-description`}
        className={styles.input}
        {...rest}
        type="checkbox"
        disabled={disabled || readOnly}
        checked={checked}
        ref={ref}
        onFocus={onFocus}
      />
      <div className={styles.checkbox}>
        <svg
          className={`${styles.mark} ${styles.checkmark}`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M3 7.5L6.5 11L13 4.5" stroke="currentColor" strokeWidth="2" />
        </svg>
        <svg
          className={`${styles.mark} ${styles.indeterminate}`}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12 8H4" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      {label && (
      <div className={sharedStyles.label}>
        <div className={sharedStyles.titleWrapper}>
          <label className={sharedStyles.title} htmlFor={`checkbox-${elementId}-input`}>
            {label}
          </label>
          {children}
        </div>
        {description && (
          <div id={`checkbox-${elementId}-description`} className={sharedStyles.description}>
            {description}
          </div>
        )}
      </div>
      )}
    </div>
  )
})
