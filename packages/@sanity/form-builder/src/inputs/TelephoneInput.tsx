import React from 'react'
import {StringSchemaType} from '@sanity/types'
import {TextInput} from '@sanity/ui'
import FormField from 'part:@sanity/components/formfields/default'
import {useId} from '@reach/auto-id'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const StringInput = React.forwardRef(function StringInput(
  props: Props<string, StringSchemaType>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, markers, level, onFocus, onBlur, onChange, presence} = props
  const inputId = useId()
  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')
  return (
    <FormField
      markers={markers}
      level={level}
      label={type.title}
      description={type.description}
      presence={presence}
      labelFor={inputId}
    >
      <TextInput
        type="tel"
        id={inputId}
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={React.useCallback(
          (event) => {
            const inputValue = event.currentTarget.value
            onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
          },
          [onChange]
        )}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={forwardedRef}
      />
    </FormField>
  )
})

export default StringInput
