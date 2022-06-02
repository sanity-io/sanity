import {TextInput} from '@sanity/ui'
import React from 'react'
import {set, unset} from '../patch'
import {getValidationRule} from '../utils/getValidationRule'
import {StringInputProps} from '../types'

export type UrlInputProps = StringInputProps

// @todo Rename to `URLInput`?
export const UrlInput = React.forwardRef(function UrlInput(
  props: UrlInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, id, readOnly, schemaType, customValidity, onFocus, onBlur, onChange} = props

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  const uriRule = getValidationRule(schemaType, 'uri')
  const inputType = uriRule?.constraint?.options?.allowRelative ? 'text' : 'url'
  return (
    <TextInput
      type={inputType}
      inputMode="url"
      id={id}
      customValidity={customValidity}
      value={value || ''}
      readOnly={Boolean(readOnly)}
      placeholder={schemaType.placeholder}
      onChange={handleChange}
      onFocus={onFocus}
      onBlur={onBlur}
      ref={forwardedRef}
    />
  )
})
