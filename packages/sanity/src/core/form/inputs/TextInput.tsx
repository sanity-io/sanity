import {type TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import {styled} from 'styled-components'

import {type StringInputProps} from '../types/inputProps'
import {PortableTextStringInput} from './StringInput/StringInputPortableText/StringInputPortableText'

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

  // Inline changes, as in the comparison view, need text that can be coloured, which a text area
  // can't hold. Read-only only: there is no typing to keep in step with a text area's behaviour.
  if (props.displayInlineChanges && props.readOnly) {
    return <PortableTextStringInput {...props} multiline />
  }

  return (
    <StyledTextArea
      customValidity={validationError}
      value={value || ''}
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      placeholder={schemaType.placeholder}
      rows={typeof schemaType.rows === 'number' ? schemaType.rows : 10}
      {...elementProps}
    />
  )
}
