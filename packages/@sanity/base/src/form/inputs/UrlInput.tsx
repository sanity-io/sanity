import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import React, {useMemo} from 'react'
import {FormField} from '../../components/formField'
import {PatchEvent, set, unset} from '../patch'
import {StringInputProps} from '../types'
import {getValidationRule} from '../utils/getValidationRule'

export type URLInputProps = StringInputProps

export function URLInput(props: URLInputProps) {
  const {inputProps, value, type, validation, level, onChange, presence} = props
  const {id: inputId, onFocus, onBlur, readOnly, ref} = inputProps
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
      __unstable_presence={presence}
      description={type.description}
      inputId={inputId}
      level={level}
      title={type.title}
      validation={validation}
    >
      <TextInput
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        id={inputId}
        inputMode="url"
        onBlur={onBlur}
        onChange={handleChange}
        onFocus={onFocus}
        placeholder={type.placeholder}
        readOnly={Boolean(readOnly)}
        ref={ref}
        type={inputType}
        value={value || ''}
      />
    </FormField>
  )
}
