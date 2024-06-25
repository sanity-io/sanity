import {TextInput, type TextInputType} from '@sanity/ui'
import {type StringSchemaType} from 'sanity'

import {type StringInputProps} from '../types'
import {getValidationRule} from '../utils/getValidationRule'

/**
 *
 * @hidden
 * @beta
 */
export type UrlInputProps = StringInputProps

/**
 *
 * @hidden
 * @beta
 */
export const getUrlInputProps = (schemaType: StringSchemaType): {type: TextInputType} => {
  const uriRule = getValidationRule(schemaType, 'uri')
  const inputType = uriRule?.constraint?.options?.allowRelative ? 'text' : 'url'

  return {type: inputType}
}

/**
 *
 * @hidden
 * @beta
 */
export function UrlInput(props: UrlInputProps) {
  const {schemaType, validationError, elementProps} = props

  const additionalInputProps = getUrlInputProps(schemaType)

  return (
    <TextInput
      {...additionalInputProps}
      inputMode="url"
      customValidity={validationError}
      {...elementProps}
    />
  )
}
