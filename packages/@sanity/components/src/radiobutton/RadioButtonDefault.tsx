import React from 'react'
import styles from './RadioButtonDefault.css'
import sharedStyles from '../toggles/shared.css'
import {useId} from '@reach/auto-id'

type Props = {
  label: string
  item: object
  onChange?: (any) => void
  onFocus: () => void
  checked: boolean
  disabled: boolean
  name: string
}

export default function RadioButton({
  item,
  disabled,
  checked,
  label,
  name,
  onChange,
  onFocus
}: Props) {
  const elementId = useId()
  const handleChange = () => {
    onChange(item)
  }

  return (
    <div className={styles.root}>
      <input
        id={`radio-${elementId}-input`}
        aria-describedby={`radio-${elementId}-description`}
        className={styles.input}
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onFocus={onFocus}
        onChange={handleChange}
      />
      <div className={styles.radio} />
      <div>
        <div className={sharedStyles.titleWrapper}>
          <label className={sharedStyles.title} htmlFor={`radio-${elementId}-input`}>
            {label}
          </label>
        </div>
      </div>
    </div>
  )
}
