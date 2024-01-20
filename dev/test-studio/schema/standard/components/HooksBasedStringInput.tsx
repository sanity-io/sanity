import {Inline, Text} from '@sanity/ui'
import {forwardRef, useState} from 'react'
import {set, type StringInputProps} from 'sanity'

export const HooksBasedStringInput = forwardRef<any, StringInputProps>((props, ref) => {
  const {value, schemaType, onChange} = props
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Inline>
      {isEditing ? (
        <input
          type="text"
          ref={ref}
          placeholder={schemaType.placeholder}
          onChange={(event) => onChange(set(event.target.value))}
          value={value}
        />
      ) : (
        <Text as="span">{value}</Text>
      )}
      <button type="button" onClick={() => setIsEditing(!isEditing)}>
        {isEditing ? 'Stop editing' : 'Start editing'}
      </button>
    </Inline>
  )
})

HooksBasedStringInput.displayName = 'HooksBasedStringInput'
