import React, {forwardRef, useCallback, useEffect, useState} from 'react'
import {Flex} from '@sanity/ui'
import {FormField} from '@sanity/base/components'
import * as Patches from '@sanity/form-builder/lib/patch/patches'
import PatchEvent from '@sanity/form-builder/lib/PatchEvent'
import PropTypes from 'prop-types'
import {useDebouncedEffect} from '../../helpers/debounce-hooks'

/**
 * ## What does it do
 * Renders a number input as a slider with min and max values, and a step.
 *
 * ## Usage
 *
 *  {
 *     type: 'number'
 *     name: 'myNumberField',
 *     inputComponent: RangeInput
 *     options: {
 *        rang:e {
 *            min: 0,
 *            max: 1,
 *            step: 0.1
 *        }
 *     }
 * }
 */

export const RangeInput = forwardRef(function RangeInput(props, ref) {
  const {type, markers, presence, onChange, value: receivedValue} = props
  const {range} = type.options || {}
  const {min = 0, max = 100, step = 1} = range || {}
  const value = receivedValue ?? min
  const [visibleValue, setVisibleValue] = useState(value)

  // This updates the visible value if a patch is received after component is mounted
  useEffect(() => setVisibleValue(value), [value])

  const handleChange = useCallback(
    (newValue) => {
      // Trigger patch only if new value is different from current value.
      // This prevents unnecessary saving when you load a draft document
      newValue !== value && onChange(PatchEvent.from(Patches.set(newValue)))
    },
    [onChange, value]
  )

  const handleInputChange = useCallback((event) => {
    const target = event.currentTarget
    const number = Number(target.value)
    if (isNaN(number) || !target.validity.valid) {
      return
    }
    setVisibleValue(number)
  }, [])

  // Debounce patching when visibleValue changes. This allows you to drag the slider without firing multiple patches
  useDebouncedEffect(
    () => {
      handleChange(visibleValue)
    },
    [visibleValue],
    500
  )

  const maxAndDecimals = max + step

  return (
    <FormField
      title={type.title}
      description={type.description}
      __unstable_markers={markers}
      __unstable_presence={presence}
    >
      <Flex gap={2} paddingTop={1} paddingBottom={1}>
        <Flex style={{position: 'relative'}}>
          <div style={{position: 'absolute', left: 0}}>{visibleValue}</div>
          {/*Need this to prevent things from jumping around as the value goes from low to high*/}
          <div aria-hidden={true} style={{visibility: 'hidden'}}>
            {maxAndDecimals}
          </div>
        </Flex>
        <Flex flex={1}>
          <input
            style={{width: '100%'}}
            type="range"
            min={min}
            max={max}
            step={step}
            ref={ref}
            value={visibleValue}
            onChange={handleInputChange}
          />
        </Flex>
      </Flex>
    </FormField>
  )
})

RangeInput.propTypes = {
  onChange: PropTypes.func,
  type: PropTypes.object,
  value: PropTypes.number,
  markers: PropTypes.array,
  presence: PropTypes.array,
}
