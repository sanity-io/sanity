import {useId} from '@reach/auto-id'
import {FormField} from '@sanity/base/components'
import React, {forwardRef, useCallback, useImperativeHandle, useMemo, useRef} from 'react'
import {TagInput} from '../components/tagInput'
import PatchEvent, {set, unset} from '../PatchEvent'
import {Props} from './types'

export const TagsArrayInput = forwardRef(
  (props: Props<string[]>, ref: React.Ref<{focus: () => void}>) => {
    const {level, markers, onChange, onFocus, presence, readOnly, type, value = []} = props
    const id = useId()
    const tagInputValue = useMemo(() => value.map((v) => ({value: v})), [value])
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
        description={type.description}
        htmlFor={id}
        level={level}
        markers={markers}
        presence={presence}
        title={type.title}
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
  }
)

TagsArrayInput.displayName = 'TagsArrayInput'
