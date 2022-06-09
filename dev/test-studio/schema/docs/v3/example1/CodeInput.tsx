import {FieldMember, ObjectInputProps, MemberField} from 'sanity/form'
import {Stack} from '@sanity/ui'
import React from 'react'

export function CodeInput(props: ObjectInputProps) {
  const {members, renderField, renderItem} = props

  const codeMember = members.find((member) => member.kind === 'field' && member.name === 'code')

  return (
    <Stack>
      {codeMember && (
        <MemberField
          member={codeMember as FieldMember}
          renderField={renderField}
          renderInput={props.renderInput}
          renderItem={renderItem}
        />
      )}
    </Stack>
  )
}
