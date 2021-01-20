import {FormField} from '@sanity/base/components'
import PropTypes from 'prop-types'
import React from 'react'
import {PatchEvent, set, unset} from 'part:@sanity/form-builder/patch-event'

import styles from './Slider.css'

const Slider = React.forwardRef(function Slider(props, ref) {
  const {level, markers, onBlur, onChange, onFocus, presence, type, value} = props
  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.target.value
      const patch = inputValue === '' ? unset() : set(Number(inputValue))
      onChange(PatchEvent.from(patch))
    },
    [onChange]
  )

  const {min, max, step} = type.options.range

  return (
    <FormField
      __unstable_markers={markers}
      __unstable_presence={presence}
      description={type.description}
      level={level}
      title={type.title}
    >
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        ref={ref}
        step={step}
        value={value === undefined ? '' : value}
        onBlur={onBlur}
        onFocus={onFocus}
        onChange={handleChange}
      />
    </FormField>
  )
})

Slider.propTypes = {
  type: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    options: PropTypes.shape({
      range: PropTypes.shape({
        min: PropTypes.number,
        max: PropTypes.number,
        step: PropTypes.number,
      }),
    }),
  }).isRequired,
  level: PropTypes.number,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
}

export default Slider
