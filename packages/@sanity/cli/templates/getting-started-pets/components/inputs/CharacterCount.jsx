import React, {forwardRef} from 'react'
import {FormField} from '@sanity/base/components'
import PatchEvent, {set, unset} from '@sanity/form-builder/PatchEvent'
import {TextArea, Flex, Text, Stack} from '@sanity/ui'
import PropTypes from 'prop-types'

/**
 * ## What does it do
 * Renders character count under a string field.
 *
 * This is a minor extension to the FormField example in the docs:
 * https://www.sanity.io/docs/custom-input-widgets#8d6dac48f8fd
 *
 * ## Usage
 *
 * {
 *     type: 'string',
 *     name: 'myStringField',
 *     inputComponent: CharacterCount
 * }
 */
export const CharacterCount = forwardRef(function CharacterCount(props, ref) {
  const {
    type, // Schema information
    value, // Current field value
    readOnly, // Boolean if field is not editable
    placeholder, // Placeholder text from the schema
    markers, // Markers including validation rules
    presence, // Presence information for collaborative avatars
    onFocus, // Method to handle focus state
    onBlur, // Method to handle blur state
    onChange,
  } = props

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  return (
    <FormField
      description={type.description} // Creates description from schema
      title={type.title} // Creates label from schema title
      __unstable_markers={markers} // Handles all markers including validation
      __unstable_presence={presence} // Handles presence avatars
    >
      <Stack space={2}>
        <TextArea
          value={value ? value : ''} // Current field value
          readOnly={readOnly} // If "readOnly" is defined make this field read only
          placeholder={placeholder} // If placeholder is defined, display placeholder text
          onFocus={onFocus} // Handles focus events
          onBlur={onBlur} // Handles blur events
          ref={ref}
          onChange={handleChange} // A function to call when the input value changes
        />

        <Flex>
          <Text muted size={1}>
            Character count: {value ? value.length : 0}
          </Text>
        </Flex>
      </Stack>
    </FormField>
  )
})

CharacterCount.propTypes = {
  onChange: PropTypes.func,
  type: PropTypes.object,
  value: PropTypes.number,
  markers: PropTypes.array,
  presence: PropTypes.array,
  readOnly: PropTypes.bool,
  placeholder: PropTypes.string,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
}
