import React, {useMemo} from 'react'
import {useId} from '@reach/auto-id'
import {isValidationErrorMarker, TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import styled from 'styled-components'
import {set, unset} from '../patch'
import {FormField} from '../../components/formField'
import {StringInputProps} from '../types'

export type TextInputProps = StringInputProps<TextSchemaType>

const StyledTextArea = styled(TextArea)`
  &[data-as='textarea'] {
    resize: vertical;
  }
`

export function TextInput(props: TextInputProps) {
  const {inputProps, value, validation, type, level, onChange, presence} = props
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
    <FormField
      __unstable_presence={presence}
      description={type.description}
      inputId={inputId}
      level={level}
      title={type.title}
      validation={validation}
    >
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
    </FormField>
  )
}
