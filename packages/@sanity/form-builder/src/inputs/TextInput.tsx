import React, {ForwardedRef, useMemo} from 'react'
import {useId} from '@reach/auto-id'
import {FormField} from '@sanity/base/components'
import {TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import styled from 'styled-components'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const StyledTextArea = styled(TextArea)`
  &[data-as='textarea'] {
    resize: vertical;
  }
`

const TextInput = React.forwardRef(function TextInput(
  props: Props<string, TextSchemaType>,
  forwardedRef: ForwardedRef<HTMLTextAreaElement>
) {
  const {value, markers, type, readOnly, level, onFocus, onBlur, onChange, presence} = props

  const inputId = useId()

  const errors = useMemo(
    () => markers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [markers]
  )

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )
  return (
    <FormField
      level={level}
      markers={markers}
      title={type.title}
      description={type.description}
      presence={presence}
      inputId={inputId}
    >
      <StyledTextArea
        id={inputId}
        customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={typeof type.rows === 'number' ? type.rows : 10}
        ref={forwardedRef}
      />
    </FormField>
  )
})

export default TextInput
