import React from 'react'
import {Card} from '@sanity/ui'
import {InputProps} from 'sanity'
import {isObjectInputProps} from 'sanity/form'

export function CustomInput(props: InputProps) {
  if (isObjectInputProps(props) && props.schemaType.title === 'Library book') {
    return (
      <Card border padding={3} tone="positive">
        {/* CustomInput */}
        {(props as any).renderInput({
          ...props,
          renderInput: () => (
            <Card border padding={3} tone="primary">
              nested
            </Card>
          ),
        })}
      </Card>
    )
  }

  return (props as any).renderInput(props)
}
