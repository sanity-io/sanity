import React, {useMemo} from 'react'
import {isValidationErrorMarker, StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {FormField} from '../../components'
import {FormInputProps} from '../types'
import {PatchEvent, set, unset} from '../patch'

export type TelephoneInputProps = FormInputProps<string, StringSchemaType>

export const TelephoneInput = React.forwardRef(function TelephoneInput(
  props: TelephoneInputProps,
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
      validation={validation}
      title={type.title}
      description={type.description}
      __unstable_presence={presence}
      inputId={inputId}
    >
      <TextInput
        type="tel"
        inputMode="tel"
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
