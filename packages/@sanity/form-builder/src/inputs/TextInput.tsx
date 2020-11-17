import React, {ForwardedRef} from 'react'
import {TextSchemaType} from '@sanity/types'
import {TextArea} from '@sanity/ui'
import {useId} from '@reach/auto-id'

import {FormField} from '@sanity/base/components'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const TextInput = React.forwardRef(function TextInput(
  props: Props<string, TextSchemaType>,
  forwardedRef: ForwardedRef<HTMLTextAreaElement>
) {
  const {value, markers, type, readOnly, level, onFocus, onBlur, onChange, presence} = props

  const inputId = useId()

  const validation = markers.filter((marker) => marker.type === 'validation')
  const errors = validation.filter((marker) => marker.level === 'error')

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
      __unstable_markers={markers}
      title={type.title}
      description={type.description}
      __unstable_presence={presence}
      inputId={inputId}
    >
      <TextArea
        id={inputId}
        customValidity={errors && errors.length > 0 ? errors[0].item.message : ''}
        value={value || ''}
        readOnly={Boolean(readOnly)}
        placeholder={type.placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        rows={type.rows}
        ref={forwardedRef}
      />
    </FormField>
  )
})

export default TextInput
