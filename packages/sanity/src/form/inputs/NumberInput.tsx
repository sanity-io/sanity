import React from 'react'

import {TextInput} from '@sanity/ui'
import {getValidationRule} from '../utils/getValidationRule'
import {NumberInputProps} from '../types'

export function NumberInput(props: NumberInputProps) {
  const {schemaType, validationError, value, elementProps} = props

  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(schemaType, 'min')
  const onlyPositiveNumber = (minRule?.constraint || 0) >= 0

  return (
    <TextInput
      {...elementProps}
      type="number"
      step="any"
      inputMode={onlyPositiveNumber ? 'numeric' : 'text'}
      customValidity={validationError}
      value={value}
      placeholder={schemaType.placeholder}
      pattern={onlyPositiveNumber ? '[d]*' : undefined}
    />
  )
}
