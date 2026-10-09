import {type TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'

import {type StringInputProps} from '../types/inputProps'
import {textArea} from './TextInput.css'

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
      className={textArea}
      customValidity={validationError}
      value={value || ''}
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      placeholder={schemaType.placeholder}
      rows={typeof schemaType.rows === 'number' ? schemaType.rows : 10}
      {...elementProps}
    />
  )
}
