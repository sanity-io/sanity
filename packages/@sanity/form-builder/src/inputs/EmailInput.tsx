import React, {useMemo} from 'react'
import {isValidationErrorMarker, StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {FormField} from '@sanity/base/components'
import {PatchEvent, set, unset, FormInputProps} from '@sanity/base/form'

export type EmailInputProps = FormInputProps<string, StringSchemaType>

export const EmailInput = React.forwardRef(function EmailInput(
  props: EmailInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, validation, level, onFocus, onBlur, onChange, presence} = props
  const inputId = useId()

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
