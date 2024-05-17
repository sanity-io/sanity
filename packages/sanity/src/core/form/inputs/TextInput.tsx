import {type TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import {styled} from 'styled-components'

import {type StringInputProps} from '../types'

/**
 *
 * @hidden
 * @beta
 */
export type TextInputProps = StringInputProps<TextSchemaType>

const StyledTextArea = styled(TextArea)`
  &[data-as='textarea'] {
    resize: vertical;
  }
`

/**
 *
 * @hidden
 * @beta
 */
export function TextInput(props: TextInputProps) {
  const {schemaType, validationError, value, elementProps} = props

  return (
    <StyledTextArea
      customValidity={validationError}
      value={value || ''}
      placeholder={schemaType.placeholder}
      rows={typeof schemaType.rows === 'number' ? schemaType.rows : 10}
      {...elementProps}
    />
  )
}
