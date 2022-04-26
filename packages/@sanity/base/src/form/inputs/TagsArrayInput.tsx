import {useId} from '@reach/auto-id'
import React, {useCallback, useMemo} from 'react'
import {FormField} from '../../components/formField'
import {set, unset} from '../patch'
import {TagInput} from '../components/tagInput'
import {ArrayInputProps} from '../types'

export type TagsArrayInputProps = ArrayInputProps<string[]>

export function TagsArrayInput(props: TagsArrayInputProps) {
  const {inputProps, level, validation, onChange, presence, type, value = []} = props
  const {onFocus, readOnly, ref} = inputProps
  const id = useId()
  const tagInputValue = useMemo(() => value?.map((v) => ({value: v})), [value])

  const handleChange = useCallback(
    (nextValue: {value: string}[]) => {
      onChange(nextValue.length === 0 ? unset() : set(nextValue.map((v) => v.value)))
    },
    [onChange]
  )

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
        ref={ref}
        value={tagInputValue}
      />
    </FormField>
  )
}
