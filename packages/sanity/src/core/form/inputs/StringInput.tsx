import React from 'react'
import {TextInput} from '@sanity/ui'
import {StringInputProps} from '../types'

/**
 * @beta
 */
export function StringInput(props: StringInputProps) {
  const {validationError, elementProps} = props
  document.body.style.height += 0.001
  return <TextInput {...elementProps} customValidity={validationError} data-testid="string-input" />
}
