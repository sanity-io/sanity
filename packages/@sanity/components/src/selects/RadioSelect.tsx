import classNames from 'classnames'
import React from 'react'
import RadioButton from '../radiobutton/RadioButtonDefault'
import styles from './RadioSelect.css'

interface RadioSelectProps {
  name?: string
  direction: 'horizontal' | 'vertical'
  onFocus?: (evt: React.FocusEvent<HTMLInputElement>) => void
  onChange?: (val: any) => void
  value: any
  readOnly?: boolean
  items: {title: string}[]
  inputId?: string
}

const RadioSelect = React.forwardRef((props: RadioSelectProps, ref: React.Ref<HTMLDivElement>) => {
  const {name, direction, onChange, onFocus, value, readOnly, items = [], inputId} = props

  const handleRadioChange = item => {
    if (onChange) onChange(item)
  }

  return (
    <div
      className={classNames(
        styles.root,
        direction == 'vertical' ? styles.vertical : styles.horizontal
      )}
      ref={ref}
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
})

RadioSelect.displayName = 'RadioSelect'

export default RadioSelect
