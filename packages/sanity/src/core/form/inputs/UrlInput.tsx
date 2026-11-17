import {TextInput} from '@sanity/ui'

import {type StringInputProps} from '../types/inputProps'
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

  const uriOptions = getValidationRule(schemaType, 'uri')?.constraint?.options
  const inputType = uriOptions?.allowRelative || uriOptions?.relativeOnly ? 'text' : 'url'
  return (
    <TextInput
      type={inputType}
      inputMode="url"
      customValidity={validationError}
      {...elementProps}
    />
  )
}
