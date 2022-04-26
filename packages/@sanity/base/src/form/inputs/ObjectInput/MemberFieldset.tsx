import React, {useCallback} from 'react'
import {FormFieldSet} from '../../../components/formField'
import {FieldSetMember, RenderFieldCallback} from '../../types'
import {MemberField} from './MemberField'

export function MemberFieldset(props: {
  member: FieldSetMember
  // onSetCollapsed: (collapsed: boolean) => void
  renderField: RenderFieldCallback
}) {
  const {member, renderField} = props

  const onSetCollapsed = useCallback((collapsed: boolean) => {
    console.warn('todo: set collapsed', collapsed)
  }, [])

  return (
    <FormFieldSet
      title={member.fieldSet.title}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      onSetCollapsed={onSetCollapsed}
      // onSetCollapsed={member.fieldSet.onSetCollapsed}
    >
      {member.fieldSet.fields.map((fieldsetMember) => (
        <MemberField member={fieldsetMember} renderField={renderField} key={fieldsetMember.key} />
      ))}
    </FormFieldSet>
  )
}
