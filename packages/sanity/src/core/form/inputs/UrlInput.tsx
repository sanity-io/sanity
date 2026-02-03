import {TextInput} from '@sanity/ui'

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
