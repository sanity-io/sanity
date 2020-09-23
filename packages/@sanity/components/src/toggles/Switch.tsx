import React, {useCallback, useEffect, useRef} from 'react'
import {useId} from '@reach/auto-id'
import {Marker} from '@sanity/types'
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
        id={`switch-${elementId}-input`}
        aria-describedby={`switch-${elementId}-description`}
        className={styles.input}
        type="checkbox"
        disabled={disabled || readOnly}
        checked={checked || false}
        ref={setRef}
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
