import {type TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'

import {type StringInputProps} from '../types'
import {textInput} from './TextInput.css'

/**
 *
 * @hidden
 * @beta
 */
export type TextInputProps = StringInputProps<TextSchemaType>

/**
 *
 * @hidden
 * @beta
 */
export function TextInput(props: TextInputProps) {
  const {schemaType, validationError, value, elementProps} = props

  return (
    <TextArea
      customValidity={validationError}
      value={value || ''}
      placeholder={schemaType.placeholder}
      rows={typeof schemaType.rows === 'number' ? schemaType.rows : 10}
      {...elementProps}
      className={textInput}
    />
  )
}
