import React from 'react'
import {TextInput} from '@sanity/ui'
import {StringInputProps} from '../types'

export type EmailInputProps = StringInputProps

export function EmailInput(props: EmailInputProps) {
  const {validationError, elementProps} = props
  return (
    <TextInput {...elementProps} type="email" inputMode="email" customValidity={validationError} />
  )
}
