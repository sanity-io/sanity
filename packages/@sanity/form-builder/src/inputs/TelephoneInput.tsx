import React, {useMemo} from 'react'
import {StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import {useId} from '@reach/auto-id'
import {FormField} from '../components/FormField'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const TelephoneInput = React.forwardRef(function TelephoneInput(
  props: Props<string, StringSchemaType>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, markers, level, onFocus, onBlur, onChange, presence} = props
  const inputId = useId()

  const errors = useMemo(
    () => markers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [markers]
  )

  const handleChange = React.useCallback(
    (event) => {
      const inputValue = event.currentTarget.value
      onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
    },
    [onChange]
  )
  return (
    <FormField
      level={level}
      markers={markers}
      title={type.title}
      description={type.description}
      presence={presence}
      inputId={inputId}
    >
      <TextInput
        type="tel"
        inputMode="tel"
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

export default TelephoneInput
