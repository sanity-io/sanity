import {TextInput} from '@sanity/ui'
import React from 'react'
import {set, unset} from '../patch'
import {getValidationRule} from '../utils/getValidationRule'
import {StringInputProps} from '../types'
import {ChangeIndicator} from '../../components/changeIndicators'

export type UrlInputProps = StringInputProps

// @todo Rename to `URLInput`?
export const UrlInput = React.forwardRef(function UrlInput(
  props: UrlInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
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

  const uriRule = getValidationRule(schemaType, 'uri')
  const inputType = uriRule?.constraint?.options?.allowRelative ? 'text' : 'url'
  return (
    <ChangeIndicator path={path} isChanged={changed} hasFocus={!!focused}>
      <TextInput
        type={inputType}
        inputMode="url"
        id={id}
        customValidity={validationError}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={schemaType.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={forwardedRef}
      />
    </ChangeIndicator>
  )
})
