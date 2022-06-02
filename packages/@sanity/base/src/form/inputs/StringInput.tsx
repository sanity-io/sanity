import React from 'react'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'

export function StringInput(props: StringInputProps) {
  const {value, readOnly, id, focusRef, schemaType, onFocus, onBlur, onChange} = props
  const placeholder = schemaType.placeholder
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  return (
    <TextInput
      id={id}
      customValidity={props.customValidity}
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
