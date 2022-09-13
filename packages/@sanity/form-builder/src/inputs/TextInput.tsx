import React, {ForwardedRef, useCallback, useEffect, useMemo, useState} from 'react'
import {useId} from '@reach/auto-id'
import {FormField} from '@sanity/base/components'
import {TextSchemaType} from '@sanity/types'
import {TextArea, useForwardedRef} from '@sanity/ui'
import styled from 'styled-components'
import {throttle} from 'lodash'
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

  const [localValue, setLocalValue] = useState(null)
  const inputRef = useForwardedRef(forwardedRef)

  const throttledSubmit = useMemo(
    () =>
      throttle(
        () => {
          const inputValue = inputRef.current.value
          onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
          setLocalValue(null)
        },
        500,
        {leading: false, trailing: true}
      ),
    [inputRef, onChange]
  )

  useEffect(() => () => throttledSubmit.flush(), [throttledSubmit])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const inputValue = event.currentTarget.value
      setLocalValue(inputValue)
      throttledSubmit()
    },
    [throttledSubmit]
  )

  return (
    <FormField
      level={level}
      __unstable_markers={markers}
      title={type.title}
      description={type.description}
      __unstable_presence={presence}
      inputId={inputId}
    >
      <StyledTextArea
        id={inputId}
        customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
        value={(localValue === null ? value : localValue) || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={typeof type.rows === 'number' ? type.rows : 10}
        ref={inputRef}
      />
    </FormField>
  )
})

export default TextInput
