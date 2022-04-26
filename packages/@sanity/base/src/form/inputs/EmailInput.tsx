import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {FormField} from '../../components/formField'
import {PatchEvent, set, unset} from '../patch'
import {StringInputProps} from '../types'

export type EmailInputProps = StringInputProps

export const EmailInput = React.forwardRef(function EmailInput(
  props: EmailInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {inputProps, value, type, validation, level, onChange, presence} = props
  const {id: inputId, onFocus, onBlur, readOnly} = inputProps

  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

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
      validation={validation}
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
