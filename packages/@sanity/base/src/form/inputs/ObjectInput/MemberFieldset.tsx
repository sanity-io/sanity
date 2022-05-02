/* eslint-disable react/jsx-handler-names */

import React from 'react'
import {FormFieldSet} from '../../../components/formField'
import {RenderFieldCallback, RenderInputCallback} from '../../types'
import {FieldSetMember} from '../../store/types/members'
import {MemberField} from './MemberField'

export function MemberFieldset(props: {
  member: FieldSetMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
}) {
  const {member, renderField, renderInput} = props

  return (
    <FormFieldSet
      title={member.fieldSet.title}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      // onSetCollapsed={member.fieldSet.onSetCollapsed}
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
