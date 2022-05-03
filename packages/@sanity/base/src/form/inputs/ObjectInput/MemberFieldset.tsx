/* eslint-disable react/jsx-handler-names */

import React, {useCallback} from 'react'
import {RenderFieldCallback, RenderInputCallback} from '../../types'
import {FieldSetMember} from '../../store/types/members'
import {MemberField} from './MemberField'
import {FormFieldSet} from '../../components/formField/FormFieldSet'

export function MemberFieldset(props: {
  member: FieldSetMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  onSetFieldSetCollapsed: (fieldsetName: string, collapsed: boolean) => void
}) {
  const {member, renderField, renderInput, onSetFieldSetCollapsed} = props

  const handleSetCollapsed = useCallback(
    (collapsed: boolean) => {
      onSetFieldSetCollapsed(member.fieldSet.name, collapsed)
    },
    [member.fieldSet.name, onSetFieldSetCollapsed]
  )

  return (
    <FormFieldSet
      title={member.fieldSet.title}
      description={member.fieldSet.description}
      level={member.fieldSet.level}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      onSetCollapsed={handleSetCollapsed}
    >
      {member.fieldSet.fields.map((fieldsetMember) => (
        <MemberField
          member={fieldsetMember}
          renderField={renderField}
          renderInput={renderInput}
          key={fieldsetMember.key}
        />
      ))}
    </FormFieldSet>
  )
}
