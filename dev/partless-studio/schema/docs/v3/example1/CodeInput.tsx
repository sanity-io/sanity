import {FieldMember, FormNode, ObjectInputProps} from '@sanity/base/form'
import {Stack} from '@sanity/ui'
import React from 'react'

export function CodeInput(props: ObjectInputProps) {
  const {members, renderField} = props

  const fields = members
    .filter((member) => member.type === 'field')
    .map((member) => (member as FieldMember).field)

  const codeField = fields.find((field) => field.name === 'code')

  return <Stack>{codeField && <FormNode fieldProps={codeField} renderField={renderField} />}</Stack>
}
