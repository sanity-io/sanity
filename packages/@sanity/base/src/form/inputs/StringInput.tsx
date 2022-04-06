import React, {useMemo} from 'react'
import {useId} from '@reach/auto-id'
import {isValidationErrorMarker, StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {FormField} from '../../components/formField'
import {FormInputProps} from '../types'
import {PatchEvent, set, unset} from '../patch'

export type StringInputProps = FormInputProps<string, StringSchemaType>

export const StringInput = React.forwardRef(function StringInput(
  props: StringInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, validation, onFocus, onBlur, onChange} = props
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

  return useMemo(
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
})
