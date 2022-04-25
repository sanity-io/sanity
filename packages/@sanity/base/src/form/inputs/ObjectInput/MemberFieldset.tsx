/* eslint-disable react/jsx-handler-names */

import React from 'react'
import {FormFieldSet} from '../../../components/formField'
import {FieldSetMember} from '../../store/types'
import {RenderFieldCallback} from '../../types_v3'
import {MemberField} from './MemberField'

export function MemberFieldset(props: {member: FieldSetMember; renderField: RenderFieldCallback}) {
  const {member, renderField} = props

  return (
    <FormFieldSet
      title={member.fieldSet.title}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      onSetCollapsed={member.fieldSet.onSetCollapsed}
    >
      {member.fieldSet.fields.map((fieldsetMember) => (
        <MemberField member={fieldsetMember} renderField={renderField} key={fieldsetMember.key} />
      ))}
    </FormFieldSet>
  )
}
