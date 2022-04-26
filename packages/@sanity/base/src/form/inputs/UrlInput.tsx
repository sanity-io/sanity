import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import React, {useMemo} from 'react'
import {PatchEvent, set, unset} from '../patch'
import {FormField} from '../../components/formField'
import {getValidationRule} from '../utils/getValidationRule'
import {StringInputProps} from '../types'

export type UrlInputProps = StringInputProps

// @todo Rename to `URLInput`?
export const UrlInput = React.forwardRef(function UrlInput(
  props: UrlInputProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {inputProps, value, type, validation, level, onChange, presence} = props
  const {id: inputId, onFocus, onBlur, readOnly} = inputProps
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )

  const uriRule = getValidationRule(type, 'uri')
  const inputType = uriRule?.constraint?.options?.allowRelative ? 'text' : 'url'
  return (
    <FormField
      level={level}
      validation={validation}
      title={type.title}
      description={type.description}
      __unstable_presence={presence}
      inputId={inputId}
    >
      <TextInput
        type={inputType}
        inputMode="url"
        id={inputId}
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={forwardedRef}
      />
    </FormField>
  )
})
