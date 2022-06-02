/* eslint-disable react/jsx-handler-names */

import React, {memo, useCallback} from 'react'
import {
  RenderFieldCallback,
  RenderInputCallback,
  RenderArrayOfObjectsItemCallback,
} from '../../types'
import {FieldSetMember} from '../../store/types/members'
import {FormFieldSet} from '../../components/formField/FormFieldSet'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {MemberField} from './MemberField'

export const MemberFieldset = memo(function MemberFieldset(props: {
  member: FieldSetMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
}) {
  const {member, renderField, renderInput, renderItem} = props

  const {onSetFieldSetCollapsed} = useFormCallbacks()

  const handleCollapse = useCallback(() => {
    onSetFieldSetCollapsed(member.fieldSet.path, true)
  }, [member.fieldSet.path, onSetFieldSetCollapsed])

  const handleExpand = useCallback(() => {
    onSetFieldSetCollapsed(member.fieldSet.path, false)
  }, [member.fieldSet.path, onSetFieldSetCollapsed])

  return (
    <FormFieldSet
      title={member.fieldSet.title}
      description={member.fieldSet.description}
      level={member.fieldSet.level}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      onCollapse={handleCollapse}
      onExpand={handleExpand}
    >
      {member.fieldSet.fields.map((fieldsetMember) => (
        <MemberField
          member={fieldsetMember}
          renderField={renderField}
          renderInput={renderInput}
          renderItem={renderItem}
          key={fieldsetMember.key}
        />
      ))}
    </FormFieldSet>
  )
})
