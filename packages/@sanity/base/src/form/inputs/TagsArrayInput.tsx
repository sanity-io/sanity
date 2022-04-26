import {useId} from '@reach/auto-id'
import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef} from 'react'
import {FormField} from '../../components/formField'
import {PatchEvent, set, unset} from '../patch'
import {TagInput} from '../components/tagInput'
import {ArrayInputProps} from '../types'

export type TagsArrayInputProps = ArrayInputProps<string[]>

export const TagsArrayInput = forwardRef(function TagsArrayInput(
  props: TagsArrayInputProps,
  ref: React.Ref<{focus: () => void}>
) {
  const {inputProps, level, validation, onChange, presence, type, value = []} = props
  const {onFocus, readOnly} = inputProps
  const id = useId()
  const tagInputValue = useMemo(() => value?.map((v) => ({value: v})), [value])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = useCallback(
    (nextValue: {value: string}[]) => {
      const patch = nextValue.length === 0 ? unset() : set(nextValue.map((v) => v.value))

      onChange(PatchEvent.from(patch))
    },
    [onChange]
  )

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  return (
    <FormField
      level={level}
      title={type.title}
      description={type.description}
      __unstable_presence={presence}
      inputId={id}
      validation={validation}
    >
      <TagInput
        id={id}
        onChange={handleChange}
        onFocus={onFocus}
        readOnly={readOnly}
        ref={inputRef}
        value={tagInputValue}
      />
    </FormField>
  )
})
