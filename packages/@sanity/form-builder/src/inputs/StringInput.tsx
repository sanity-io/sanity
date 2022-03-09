import React, {useMemo} from 'react'
import {useId} from '@reach/auto-id'
import {isValidationErrorMarker, StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {FormField} from '@sanity/base/components'
import PatchEvent, {set, unset} from '../PatchEvent'
import {FormInputProps} from '../types'

export type StringInputProps = FormInputProps<string, StringSchemaType>

const StringInput = React.forwardRef(function StringInput(
  props: StringInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, validation, level, onFocus, onBlur, onChange, presence} = props
  const placeholder = type.placeholder
  const inputId = useId()
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  const input = useMemo(
    () => (
      <TextInput
        id={inputId}
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={forwardedRef}
      />
    ),
    [errors, forwardedRef, handleChange, inputId, onBlur, onFocus, placeholder, readOnly, value]
  )

  return (
    <FormField
      description={type.description}
      inputId={inputId}
      level={level}
      validation={validation}
      __unstable_presence={presence}
      title={type.title}
    >
      {input}
    </FormField>
  )
})

export default StringInput
