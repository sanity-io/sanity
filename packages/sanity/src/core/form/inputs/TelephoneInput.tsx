import {type StringInputProps} from '../types'
import {TextInput} from '@sanity/ui'

/**
 *
 * @hidden
 * @beta
 */
export type TelephoneInputProps = StringInputProps

/**
 *
 * @hidden
 * @beta
 */
export function TelephoneInput(props: TelephoneInputProps) {
  const {schemaType, validationError, value, elementProps} = props

  return (
    <TextInput
      type="tel"
      inputMode="tel"
      customValidity={validationError}
      value={value || ''}
      placeholder={schemaType.placeholder}
      {...elementProps}
    />
  )
}
