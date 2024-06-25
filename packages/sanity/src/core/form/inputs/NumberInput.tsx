import {TextInput} from '@sanity/ui'
import {type HTMLAttributes} from 'react'
import {type NumberSchemaType} from 'sanity'

import {type NumberInputProps} from '../types'
import {getValidationRule} from '../utils/getValidationRule'

/**
 *
 * @hidden
 * @beta
 */
export const getNumberInputProps: (schemaType: NumberSchemaType) => {
  pattern?: string
  inputMode: HTMLAttributes<HTMLInputElement>['inputMode']
} = (schemaType) => {
  // Show numpad on mobile if only positive numbers is preferred
  const minRule = getValidationRule(schemaType, 'min')
  const integerRule = getValidationRule(schemaType, 'integer')
  const precisionRule = getValidationRule(schemaType, 'precision')
  const onlyPositiveNumber = typeof minRule?.constraint === 'number' && minRule?.constraint >= 0
  const onlyIntegers = integerRule || precisionRule?.constraint === 0

  // eslint-disable-next-line no-nested-ternary
  const inputMode = onlyPositiveNumber ? (onlyIntegers ? 'numeric' : 'decimal') : 'text'

  return {pattern: onlyPositiveNumber ? '[d]*' : undefined, inputMode}
}

/**
 *
 * @hidden
 * @beta
 */
export function NumberInput(props: NumberInputProps) {
  const {schemaType, validationError, elementProps} = props

  const t = elementProps.onChange

  const additionalNumberProps = getNumberInputProps(schemaType)

  return (
    <TextInput
      data-testid="number-input"
      {...elementProps}
      type="number"
      step="any"
      customValidity={validationError}
      placeholder={schemaType.placeholder}
      {...additionalNumberProps}
      max={Number.MAX_SAFE_INTEGER}
      min={Number.MIN_SAFE_INTEGER}
    />
  )
}
