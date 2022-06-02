import React, {ForwardedRef} from 'react'
import {TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import styled from 'styled-components'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'

export type TextInputProps = StringInputProps<TextSchemaType>

const StyledTextArea = styled(TextArea)`
  &[data-as='textarea'] {
    resize: vertical;
  }
`

export const TextInput = React.forwardRef(function TextInput(
  props: TextInputProps,
  forwardedRef: ForwardedRef<HTMLTextAreaElement>
) {
  const {value, id, customValidity, schemaType, readOnly, onFocus, onBlur, onChange} = props

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <StyledTextArea
      id={id}
      customValidity={customValidity}
      value={value || ''}
      readOnly={Boolean(readOnly)}
      placeholder={schemaType.placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      rows={typeof schemaType.rows === 'number' ? schemaType.rows : 10}
      ref={forwardedRef}
    />
  )
})
