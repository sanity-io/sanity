import {Inline, Text} from '@sanity/ui'
import {useState, type RefAttributes} from 'react'
import {set, type StringInputProps} from 'sanity'

export function HooksBasedStringInput(props: StringInputProps & RefAttributes<any>) {
  const {ref, value, schemaType, onChange} = props
  const [isEditing, setIsEditing] = useState(false)

  return (
    <Inline>
      {isEditing ? (
        <input
          type="text"
          ref={ref}
          // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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
}
