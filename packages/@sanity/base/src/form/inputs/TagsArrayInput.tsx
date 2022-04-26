import React, {useCallback, useMemo} from 'react'
import {set, unset} from '../patch'
import {TagInput} from '../components/tagInput'
import {ArrayInputProps} from '../types'

export type TagsArrayInputProps = ArrayInputProps<string[]>

export function TagsArrayInput(props: TagsArrayInputProps) {
  const {inputProps, onChange, value = []} = props
  const {id, onFocus, readOnly, ref} = inputProps
  const tagInputValue = useMemo(() => value?.map((v) => ({value: v})), [value])

  const handleChange = useCallback(
    (nextValue: {value: string}[]) => {
      onChange(nextValue.length === 0 ? unset() : set(nextValue.map((v) => v.value)))
    },
    [onChange]
  )

  return (
    <TagInput
      id={id}
      onChange={handleChange}
      onFocus={onFocus}
      readOnly={readOnly}
      ref={ref}
      value={tagInputValue}
    />
  )
}
