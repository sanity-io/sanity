import React, {useCallback, useEffect, useRef} from 'react'
import {useId} from '@reach/auto-id'
import {Marker} from '@sanity/types'
import styles from './Checkbox.css'
import sharedStyles from './shared.css'

interface CheckboxProps {
  children?: React.ReactNode
  description?: React.ReactNode
  label?: React.ReactNode
  markers?: Marker[]
  readOnly?: boolean
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
    ...rest
  }: CheckboxProps & Omit<React.HTMLProps<HTMLInputElement>, 'aria-described-by' | 'id' | 'type'>,
  ref: any
) {
  const elementId = useId()
  const innerRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (innerRef?.current) {
      innerRef.current.indeterminate = checked === undefined
    }
  }, [checked])

  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      innerRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref && typeof ref === 'object') ref.current = el
    },
    [ref]
  )

  return (
    <div className={styles.root}>
      <input
        {...rest}
        id={`checkbox-${elementId}-input`}
        aria-describedby={`checkbox-${elementId}-description`}
        className={styles.input}
        checked={checked || false}
        type="checkbox"
        disabled={disabled || readOnly}
        ref={setRef}
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
