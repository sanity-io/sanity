import React from 'react'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'

export type TelephoneInputProps = StringInputProps

export const TelephoneInput = React.forwardRef(function TelephoneInput(
  props: TelephoneInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, id, readOnly, schemaType, customValidity, onFocus, onBlur, onChange} = props

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
      customValidity={customValidity}
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
