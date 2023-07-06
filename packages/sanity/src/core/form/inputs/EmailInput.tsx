import React from 'react'
import {TextInput} from '@sanity/ui'
import {StringInputProps} from '../types'

/**
 *
 * @hidden
 * @beta
 */
export type EmailInputProps = StringInputProps

/**
 *
 * @hidden
 * @beta
 */
export function EmailInput(props: EmailInputProps) {
  const {validationError, elementProps} = props
  return (
    <TextInput {...elementProps} type="email" inputMode="email" customValidity={validationError} />
  )
}
