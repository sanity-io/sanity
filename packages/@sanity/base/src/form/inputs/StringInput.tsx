import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {FormField} from '../../components/formField'
import {PatchEvent, set, unset} from '../patch'
import {StringInputComponentProps} from '../types'

export function StringInput(props: StringInputComponentProps) {
  const {
    value,
    readOnly,
    id,
    focusRef,
    type,
    validation,
    level,
    onFocus,
    onBlur,
    onChange,
    presence,
  } = props
  const placeholder = type.placeholder
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  const input = useMemo(
    () => (
      <TextInput
        id={id}
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={focusRef}
      />
    ),
    [errors, focusRef, handleChange, id, onBlur, onFocus, placeholder, readOnly, value]
  )

  return (
    <FormField
      description={type.description}
      inputId={id}
      level={level}
      validation={validation}
      __unstable_presence={presence}
      title={type.title}
    >
      {input}
    </FormField>
  )
}
