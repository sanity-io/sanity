import React from 'react'
import {TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import styled from 'styled-components'
import {StringInputProps} from '../types'

/**
 * @beta
 */
export type TextInputProps = StringInputProps<TextSchemaType>

const StyledTextArea = styled(TextArea)`
  &[data-as='textarea'] {
    resize: vertical;
  }
`

/**
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
