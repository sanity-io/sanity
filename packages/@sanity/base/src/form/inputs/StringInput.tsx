import React, {useMemo} from 'react'
import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {FormField} from '../../components/formField'
import {PatchEvent, set, unset} from '../patch'
import {StringInputProps} from '../types'

export function StringInput(props: StringInputProps) {
  const {value, readOnly, id, focusRef, schemaType, onFocus, onBlur, onChange} = props
  const placeholder = schemaType.placeholder
  // const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  return (
    <TextInput
      id={id}
      // customValidity={errors.length > 0 ? errors[0].item.message : ''}
      value={value || ''}
      readOnly={Boolean(readOnly)}
      placeholder={placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={focusRef}
    />
  )
}
