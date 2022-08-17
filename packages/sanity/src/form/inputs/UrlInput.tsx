import {TextInput} from '@sanity/ui'
import React from 'react'
import {getValidationRule} from '../utils/getValidationRule'
import {StringInputProps} from '../types'

export type UrlInputProps = StringInputProps

// @todo Rename to `URLInput`?
export function UrlInput(props: UrlInputProps) {
  const {schemaType, validationError, elementProps} = props

  const uriRule = getValidationRule(schemaType, 'uri')
  const inputType = uriRule?.constraint?.options?.allowRelative ? 'text' : 'url'
  return (
    <TextInput
      type={inputType}
      inputMode="url"
      customValidity={validationError}
      {...elementProps}
    />
  )
}
