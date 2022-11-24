import React from 'react'

import {TextInput} from '@sanity/ui'
import {getValidationRule} from '../utils/getValidationRule'
import {NumberInputProps} from '../types'

/**
 * @beta
 */
export function NumberInput(props: NumberInputProps) {
  const {schemaType, validationError, elementProps} = props

  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(schemaType, 'min')
  const integerRule = getValidationRule(schemaType, 'integer')
  const precisionRule = getValidationRule(schemaType, 'precision')
  const onlyPositiveNumber = typeof minRule?.constraint === 'number' && minRule?.constraint >= 0
  const onlyIntegers = integerRule || precisionRule?.constraint === 0

  // eslint-disable-next-line no-nested-ternary
  const inputMode = onlyPositiveNumber ? (onlyIntegers ? 'numeric' : 'decimal') : 'text'

  return (
    <TextInput
      {...elementProps}
      type="number"
      step="any"
      inputMode={inputMode}
      customValidity={validationError}
      placeholder={schemaType.placeholder}
      pattern={onlyPositiveNumber ? '[d]*' : undefined}
      max={Number.MAX_SAFE_INTEGER}
      min={Number.MIN_SAFE_INTEGER}
    />
  )
}
