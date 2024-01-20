import {Stack} from '@sanity/ui'
import {type FieldMember, MemberField, type ObjectInputProps} from 'sanity'

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
