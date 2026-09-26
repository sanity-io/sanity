import {type FieldMember, type ObjectInputProps} from 'sanity'
import {MemberField} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {VStack} from 'ui5'

export function CodeInput(props: ObjectInputProps) {
  const {members, renderField, renderItem} = props

  const codeMember = members.find((member) => member.kind === 'field' && member.name === 'code')

  return (
    <VStack>
      {codeMember && (
        // @ts-expect-error -- pre-existing, fix later
        <MemberField
          member={codeMember as FieldMember}
          renderField={renderField}
          renderInput={props.renderInput}
          renderItem={renderItem}
        />
      )}
    </VStack>
  )
}
