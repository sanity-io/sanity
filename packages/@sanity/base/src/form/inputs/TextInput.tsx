import React, {useMemo} from 'react'
import {useId} from '@reach/auto-id'
import {isValidationErrorMarker, TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import styled from 'styled-components'
import {set, unset} from '../patch'
import {FormField} from '../../components/formField'
import {StringInputProps} from '../types'
import {useFormNode} from '../components/formNode'

export type TextInputProps = StringInputProps<TextSchemaType>

const StyledTextArea = styled(TextArea)`
  &[data-as='textarea'] {
    resize: vertical;
  }
`

export function TextInput(props: TextInputProps) {
  const {validation} = useFormNode()
  const {inputProps, value, type, onChange} = props
  const {onBlur, onFocus, readOnly, ref} = inputProps
  const inputId = useId()
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <StyledTextArea
      customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
      id={inputId}
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      placeholder={type.placeholder}
      readOnly={Boolean(readOnly)}
      ref={ref}
      rows={typeof type.rows === 'number' ? type.rows : 10}
      value={value || ''}
    />
  )
}
