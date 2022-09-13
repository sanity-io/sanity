import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {useId} from '@reach/auto-id'
import {StringSchemaType} from '@sanity/types'
import {TextInput, useForwardedRef} from '@sanity/ui'
import {FormField} from '@sanity/base/components'
import {throttle} from 'lodash'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

const StringInput = React.forwardRef(function StringInput(
  props: Props<string, StringSchemaType>,
  forwardedRef: React.ForwardedRef<HTMLInputElement>
) {
  const {value, readOnly, type, markers, level, onFocus, onBlur, onChange, presence} = props
  const placeholder = type.placeholder
  const inputId = useId()

  const errors = useMemo(
    () => markers.filter((marker) => marker.type === 'validation' && marker.level === 'error'),
    [markers]
  )

  const [localValue, setLocalValue] = useState(null)
  const inputRef = useForwardedRef(forwardedRef)

  const throttledSubmit = useMemo(
    () =>
      throttle(
        () => {
          const inputValue = inputRef.current.value
          onChange(PatchEvent.from(inputValue ? set(inputValue) : unset()))
          setLocalValue(null)
        },
        500,
        {leading: false, trailing: true}
      ),
    [inputRef, onChange]
  )

  useEffect(() => () => throttledSubmit.flush(), [throttledSubmit])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.currentTarget.value
      setLocalValue(inputValue)
      throttledSubmit()
    },
    [throttledSubmit]
  )

  const input = useMemo(
    () => (
      <TextInput
        id={inputId}
        customValidity={errors.length > 0 ? errors[0].item.message : ''}
        value={(localValue === null ? value : localValue) || ''}
        readOnly={Boolean(readOnly)}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={onBlur}
        ref={inputRef}
      />
    ),
    [
      localValue,
      errors,
      handleChange,
      inputId,
      inputRef,
      onBlur,
      onFocus,
      placeholder,
      readOnly,
      value,
    ]
  )

  return (
    <FormField
      description={type.description}
      inputId={inputId}
      level={level}
      __unstable_markers={markers}
      __unstable_presence={presence}
      title={type.title}
    >
      {input}
    </FormField>
  )
})

export default StringInput
