import {TextInput} from '@sanity/ui'

import {type StringInputProps} from '../types'

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
export function TelephoneInput(props: TelephoneInputProps) : React.JSX.Element {
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
