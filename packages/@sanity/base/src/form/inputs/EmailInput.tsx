import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {FormField} from '../../components/formField'
import {PatchEvent, set, unset} from '../patch'
import {StringInputProps} from '../types'

export type EmailInputProps = StringInputProps

export function EmailInput(props: EmailInputProps) {
  const {inputProps, value, type, validation, level, onChange, presence} = props
  const {id, onBlur, onFocus, readOnly, ref} = inputProps
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
      __unstable_presence={presence}
      description={type.description}
      inputId={id}
      level={level}
      title={type.title}
      validation={validation}
    >
      <TextInput
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        id={id}
        inputMode="email"
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={onFocus}
        placeholder={type.placeholder}
        readOnly={Boolean(readOnly)}
        ref={ref}
        type="email"
        value={value || ''}
      />
    </FormField>
  )
}
