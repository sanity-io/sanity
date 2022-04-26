import {isValidationErrorMarker} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import React, {useMemo} from 'react'
import {useFormNode} from '../components/formNode'
import {set, unset} from '../patch'
import {StringInputProps} from '../types'
import {getValidationRule} from '../utils/getValidationRule'

export type URLInputProps = StringInputProps

export function URLInput(props: URLInputProps) {
  const {validation} = useFormNode()
  const {inputProps, value, type, onChange} = props
  const {id, onFocus, onBlur, readOnly, ref} = inputProps
  const errors = useMemo(() => validation.filter(isValidationErrorMarker), [validation])

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(inputValue ? set(inputValue) : unset())
    },
    [onChange]
  )

  const uriRule = getValidationRule(type, 'uri')
  const inputType = uriRule?.constraint?.options?.allowRelative ? 'text' : 'url'
  return (
    <TextInput
      customValidity={errors.length > 0 ? errors[0].item.message : ''}
      id={id}
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
  )
}
