import React, {useRef, useEffect} from 'react'
import styles from './Checkbox.css'
import {Marker} from '../typedefs'
import {useId} from '@reach/auto-id'

type Props = {
  label: string
  description: string
  markers: Marker[]
  checked: boolean
  disabled: boolean
  readOnly: boolean
  children: any
  onFocus: () => void
  onBlur: () => void
}

export default function Checkbox({
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
}: Props) {
  const elementId = useId()
  // const [isChecked, setIsChecked] = useState(checked)
  const checkboxInput = useRef(null)
  useEffect(() => {
    if (typeof checked === 'undefined' && checkboxInput.current) {
      checkboxInput.current.indeterminate = true
    }
  }, [])

  return (
    <div className={styles.root}>
      <input
        id={`${elementId}-input`}
        aria-describedby={`${elementId}-description`}
        className={styles.input}
        {...rest}
        type="checkbox"
        disabled={disabled || readOnly}
        checked={checked}
        ref={checkboxInput}
      />
      <div className={styles.checkbox}>
        <svg
          className={styles.checkmark}
          viewBox="0 0 12 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M0.73999 4.5L4.13999 7.9L10.6 1.44" stroke="currentColor" strokeWidth="2" />
        </svg>
        <div className={styles.indeterminate} />
      </div>
      <div>
        <div className={styles.titleWrapper}>
          <label className={styles.title} htmlFor={`${elementId}-input`}>
            {label}
          </label>
          {children}
        </div>
        {description && (
          <div id={`${elementId}-description`} className={styles.description}>
            {description}
          </div>
        )}
      </div>
    </div>
  )
}
