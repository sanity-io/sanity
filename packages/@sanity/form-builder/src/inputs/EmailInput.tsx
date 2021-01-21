import React from 'react'
import {StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {FormField} from '@sanity/base/components'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const EmailInput = React.forwardRef(function EmailInput(
  props: Props<string, StringSchemaType>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, markers, level, onFocus, onBlur, onChange, presence} = props
  const inputId = useId()
  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')
  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )
  return (
    <FormField
      level={level}
      title={type.title}
      description={type.description}
      inputId={inputId}
      __unstable_presence={presence}
      __unstable_markers={markers}
    >
      <TextInput
        type="email"
        inputMode="email"
        id={inputId}
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={forwardedRef}
      />
    </FormField>
  )
})

export default EmailInput
