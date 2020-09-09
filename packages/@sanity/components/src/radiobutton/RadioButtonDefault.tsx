import React, {useCallback} from 'react'
import {useId} from '@reach/auto-id'
import sharedStyles from '../toggles/shared.css'
import styles from './RadioButtonDefault.css'

type Props = {
  label: string
  item: object
  onChange?: (item: object) => void
  onFocus?: (evt: React.FocusEvent<HTMLInputElement>) => void
  checked: boolean
  disabled?: boolean
  name?: string
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

  const handleChange = useCallback(() => {
    if (onChange) onChange(item)
  }, [onChange])

  return (
    <div className={styles.root}>
      <input
        id={`radio-${elementId}-input`}
        aria-describedby={`radio-${elementId}-description`}
        className={styles.input}
        name={name}
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
