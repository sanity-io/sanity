import React, {memo, useMemo} from 'react'
import {FormFieldSet} from '../../../components/formField'
import {EMPTY_ARRAY} from '../../utils/empty'
import {ObjectInputProps, ObjectMember, RenderFieldCallback} from '../../types'
import {UnknownFields} from './UnknownFields'
import {FieldGroupTabsWrapper} from './ObjectInput.styled'
import {FieldGroupTabs} from './fieldGroups/FieldGroupTabs'
import {MemberField} from './MemberField'
import {MemberFieldset} from './MemberFieldset'

export const ObjectInput = memo(function ObjectInput(props: ObjectInputProps) {
  const {
    // focusRef,
    // id,
    collapsed,
    collapsible,
    groups,
    inputProps,
    level = 0,
    members,
    onChange,
    onSelectFieldGroup,
    onSetCollapsed,
    path,
    presence,
    renderField,
    type,
    validation,
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
    <FormFieldSet
      __unstable_changeIndicator={false}
      __unstable_presence={collapsed ? presence : EMPTY_ARRAY}
      collapsed={collapsed}
      collapsible={collapsible}
      columns={type.options?.columns}
      description={type.description}
      level={level}
      onSetCollapsed={onSetCollapsed}
      ref={inputProps.ref}
      title={type.title}
      validation={collapsed ? validation : EMPTY_ARRAY}
    >
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
    return <MemberField member={member} renderField={renderField} />
  }

  return <MemberFieldset member={member} renderField={renderField} />
}
