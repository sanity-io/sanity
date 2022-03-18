import {FormField} from '@sanity/base/components'
import {PatchEvent, set, unset} from '@sanity/base/form'
import {NumberSchemaType, Path} from '@sanity/types'
import React from 'react'
import styles from './Slider.module.css'

export interface SliderProps {
  level: number
  onChange: (event: PatchEvent) => void
  onFocus: (pathOrEvent?: Path | React.FocusEvent) => void
  type: Omit<NumberSchemaType, 'options'> & {
    options?: {
      range?: {
        min: number
        max: number
        step: number
      }
    }
  }
  value?: number
}

const Slider = React.forwardRef(function Slider(
  props: SliderProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const {type, value, level, onChange, onFocus} = props
  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.target.value
      const patch = inputValue === '' ? unset() : set(Number(inputValue))
      onChange(PatchEvent.from(patch))
    },
    [onChange]
  )

  const {min, max, step} = type.options?.range || {}

  return (
    <FormField title={type.title} level={level} description={type.description}>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        ref={ref}
        step={step}
        value={value === undefined ? '' : value}
        onFocus={onFocus}
        onChange={handleChange}
      />
    </FormField>
  )
})

export default Slider
