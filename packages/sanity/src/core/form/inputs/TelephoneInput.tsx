import {TextInput} from '@sanity/ui'

import {type StringInputProps} from '../types/inputProps'

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
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      placeholder={schemaType.placeholder}
      {...elementProps}
    />
  )
}
