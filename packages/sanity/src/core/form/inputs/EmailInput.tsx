import {type StringInputProps} from '../types'
import {TextInput} from '@sanity/ui'

/**
 *
 * @hidden
 * @beta
 */
export type EmailInputProps = StringInputProps

/**
 *
 * @hidden
 * @beta
 */
export function EmailInput(props: EmailInputProps) {
  const {validationError, elementProps} = props
  return (
    <TextInput {...elementProps} type="email" inputMode="email" customValidity={validationError} />
  )
}
