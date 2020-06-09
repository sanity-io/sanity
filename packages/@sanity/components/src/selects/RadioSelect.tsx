import React from 'react'
import styles from './styles/RadioSelect.css'
import RadioButton from '../radiobutton/RadioButtonDefault'

type Props = {
  name: string
  direction: 'horizontal' | 'vertical'
  onFocus?: () => void
  onChange?: (any) => void
  value: any
  readOnly: boolean
  items: {title: string}[]
  inputId: string
}

export default function RadioSelect({
  name,
  direction,
  onChange = () => {},
  onFocus,
  value,
  readOnly,
  items = [],
  inputId
}: Props) {
  const handleRadioChange = item => {
    onChange(item)
  }

  return (
    <div
      className={`
        ${direction == 'vertical' ? styles.vertical : styles.horizontal}
       ${styles.root}`}
    >
      <div className={styles.radioContainer} id={inputId} role="group">
        {items.map((item, i) => {
          return (
            <div className={styles.item} key={i}>
              <RadioButton
                disabled={readOnly}
                name={name}
                label={item.title}
                item={item}
                onChange={handleRadioChange}
                checked={value === item}
                onFocus={onFocus}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
