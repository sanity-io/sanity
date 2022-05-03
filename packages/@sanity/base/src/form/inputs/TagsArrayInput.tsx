import {useId} from '@reach/auto-id'
import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef} from 'react'
import {set, unset} from '../patch'
import {TagInput} from '../components/tagInput'
import {ArrayOfPrimitivesInputProps} from '../types'

export type TagsArrayInputProps = ArrayOfPrimitivesInputProps<string[]>

export const TagsArrayInput = forwardRef(function TagsArrayInput(
  props: TagsArrayInputProps,
  ref: React.Ref<{focus: () => void}>
) {
  const {id, validation, onChange, onFocus, readOnly, value = []} = props
  const tagInputValue = useMemo(() => value?.map((v) => ({value: v})), [value])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleChange = useCallback(
    (nextValue: {value: string}[]) => {
      onChange(nextValue.length === 0 ? unset() : set(nextValue.map((v) => v.value)))
    },
    [onChange]
  )

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }))

  return (
    <TagInput
      id={id}
      onChange={handleChange}
      onFocus={onFocus}
      readOnly={readOnly}
      ref={inputRef}
      value={tagInputValue}
    />
  )
})
