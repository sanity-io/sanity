import React, {ForwardedRef} from 'react'
import {TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import styled from 'styled-components'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'
import {ChangeIndicator} from '../../components/changeIndicators'

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
  const {
    changed,
    focused,
    id,
    onBlur,
    onChange,
    onFocus,
    path,
    readOnly,
    schemaType,
    validationError,
    value,
  } = props

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
      <StyledTextArea
        id={id}
        customValidity={validationError}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={schemaType.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={typeof schemaType.rows === 'number' ? schemaType.rows : 10}
        ref={forwardedRef}
      />
    </ChangeIndicator>
  )
})
