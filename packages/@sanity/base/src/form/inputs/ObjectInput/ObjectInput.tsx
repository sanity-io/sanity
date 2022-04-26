import React, {memo, useMemo} from 'react'
import {FormFieldSet} from '../../../components/formField'
import {ObjectInputProps, ObjectMember, RenderFieldCallback} from '../../types'
import {FormNode, useFormNode} from '../../components/formNode'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {MemberFieldset} from './MemberFieldset'

export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {level, path} = useFormNode()

  const {
    groups,
    inputProps,
    members,
    onChange,
    onSelectFieldGroup,
    onSetCollapsed,
    renderField,
    type,
    value,
  } = props

  const renderedUnknownFields = useMemo(() => {
    if (!type.fields) {
      return null
    }

    const knownFieldNames = type.fields.map((field) => field.name)
    const unknownFields = Object.keys(value || {}).filter(
      (key) => !key.startsWith('_') && !knownFieldNames.includes(key)
    )

    if (unknownFields.length === 0) {
      return null
    }

    return <UnknownFields fieldNames={unknownFields} value={value} onChange={onChange} />
  }, [onChange, type.fields, value])

  return (
    <FormFieldSet onSetCollapsed={onSetCollapsed} ref={inputProps.ref}>
      {groups && groups?.length > 0 ? (
        <FieldGroupTabsWrapper $level={level} data-testid="field-groups">
          <FieldGroupTabs
            groups={groups}
            inputId={inputProps.id}
            onClick={onSelectFieldGroup}
            shouldAutoFocus={path.length === 0}
          />
        </FieldGroupTabsWrapper>
      ) : null}

      {members.map((member) => (
        <Member key={member.key} member={member} renderField={renderField} />
      ))}
      {renderedUnknownFields}
    </FormFieldSet>
  )
})

function Member(props: {member: ObjectMember; renderField: RenderFieldCallback}) {
  const {member, renderField} = props

  if (member.type === 'field') {
    return <FormNode fieldProps={member.field} renderField={renderField} />
  }

  return <MemberFieldset member={member} renderField={renderField} />
}
