import {TextInput} from '@sanity/ui'

import {type StringInputProps} from '../types'

/**
 *
 * @hidden
 * @beta
 */
export function StringInput(props: StringInputProps) {
  const {validationError, elementProps} = props
  return <TextInput {...elementProps} customValidity={validationError} data-testid="string-input" />
}
