import React from 'react'
import {TextInput} from '@sanity/ui'
import {StringInputProps} from '../types'

export type TelephoneInputProps = StringInputProps

export function TelephoneInput(props: TelephoneInputProps) {
  const {schemaType, validationError, value, elementProps} = props

  return (
    <TextInput
      type="tel"
      inputMode="tel"
      customValidity={validationError}
      value={value || ''}
      placeholder={schemaType.placeholder}
      {...elementProps}
    />
  )
}
