import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'

export type TelephoneInputProps = StringInputProps

export const TelephoneInput = React.forwardRef(function TelephoneInput(
  props: TelephoneInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, id, readOnly, schemaType, validation, onFocus, onBlur, onChange} = props
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <TextInput
      type="tel"
      inputMode="tel"
      id={id}
      customValidity={errors.length > 0 ? errors[0].item.message : ''}
      value={value || ''}
      readOnly={Boolean(readOnly)}
      placeholder={schemaType.placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={forwardedRef}
    />
  )
})
