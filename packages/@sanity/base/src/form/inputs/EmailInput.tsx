import React from 'react'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'

export type EmailInputProps = StringInputProps

export const EmailInput = React.forwardRef(function EmailInput(
  props: EmailInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {id, value, readOnly, schemaType, customValidity, onFocus, onBlur, onChange} = props

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <TextInput
      type="email"
      inputMode="email"
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
