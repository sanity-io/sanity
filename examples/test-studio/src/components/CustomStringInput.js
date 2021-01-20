import {FormField} from '@sanity/base/components'
import {TextInput} from '@sanity/ui'
import React, {forwardRef, useCallback, useImperativeHandle, useRef} from 'react'
import {PatchEvent, set, unset} from 'part:@sanity/form-builder/patch-event'

export const CustomStringInput = forwardRef((props, ref) => {
  const {level, markers, onBlur, onChange, onFocus, presence, readOnly, type, value} = props
  const inputRef = useRef(null)

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  const handleChange = useCallback(
    (event) => {
      const newValue = event.currentTarget.value

      onChange(PatchEvent.from(newValue ? set(newValue) : unset()))
    },
    [onChange]
  )

  return (
    <FormField
      __unstable_markers={markers}
      __unstable_presence={presence}
      description={type.description}
      level={level}
      title={type.title}
    >
      <TextInput
        disabled={readOnly}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={type.placeholder}
        ref={inputRef}
        value={value || ''}
      />
    </FormField>
  )
})

CustomStringInput.displayName = 'CustomStringInput'
