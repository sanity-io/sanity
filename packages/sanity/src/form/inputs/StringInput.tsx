import React from 'react'
import {TextInput} from '@sanity/ui'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'
import {ChangeIndicator} from '../../components/changeIndicators'

export function StringInput(props: StringInputProps) {
  const {
    value,
    readOnly,
    id,
    path,
    focused,
    focusRef,
    schemaType,
    validationError,
    onFocus,
    onBlur,
    onChange,
    changed,
  } = props
  const placeholder = schemaType.placeholder
  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )
  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
      <TextInput
        id={id}
        customValidity={validationError}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={focusRef}
      />
    </ChangeIndicator>
  )
}
