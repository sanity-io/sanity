import {TextInput} from '@sanity/ui'

import {type StringInputProps} from '../../../types'

/**
 * This is the default string input implementation, powered by Sanity UI's `TextInput` component. It
 * will likely be superseded by the Portable Text Editor based implementation in the future.
 *
 * @hidden
 * @beta
 */
export function StringInputBasic(props: StringInputProps) {
  const {validationError, elementProps} = props
  return <TextInput {...elementProps} customValidity={validationError} data-testid="string-input" />
}
