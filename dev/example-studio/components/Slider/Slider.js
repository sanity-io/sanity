import PropTypes from 'prop-types'
import React from 'react'
import FormField from 'part:@sanity/components/formfields/default'
import {PatchEvent, set, unset} from 'part:@sanity/form-builder/patch-event'

import styles from './Slider.css'

const Slider = React.forwardRef(function Slider(props, ref) {
  const {type, value, level, onChange, onFocus} = props
  const handleChange = React.useCallback((event) => {
    const inputValue = event.target.value
    const patch = inputValue === '' ? unset() : set(Number(inputValue))
    onChange(PatchEvent.from(patch))
  }, [])

  const {min, max, step} = type.options.range

  return (
    <FormField label={type.title} level={level} description={type.description}>
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
