import React, {memo, useCallback} from 'react'
import {capitalize} from 'lodash'
import {FieldSetMember} from '../../store'
import {
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'
import {FormFieldSet} from '../../components/formField'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {MemberField} from './MemberField'
import {MemberFieldError} from './MemberFieldError'

/** @internal */
export const MemberFieldSet = memo(function MemberFieldSet(props: {
  member: FieldSetMember
  renderField: RenderFieldCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}) {
  const {member, renderField, renderInput, renderItem, renderPreview} = props

  const {onSetFieldSetCollapsed} = useFormCallbacks()

  const handleCollapse = useCallback(() => {
    onSetFieldSetCollapsed(member.fieldSet.path, true)
  }, [member.fieldSet.path, onSetFieldSetCollapsed])

  const handleExpand = useCallback(() => {
    onSetFieldSetCollapsed(member.fieldSet.path, false)
  }, [member.fieldSet.path, onSetFieldSetCollapsed])

  return (
    <FormFieldSet
      title={member.fieldSet.title || capitalize(member.fieldSet.name)}
      description={member.fieldSet.description}
      level={member.fieldSet.level}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      onCollapse={handleCollapse}
      onExpand={handleExpand}
      columns={member?.fieldSet?.columns}
      data-testid={`fieldset-${member.fieldSet.name}`}
    >
      {member.fieldSet.members.map((fieldsetMember) => {
        if (fieldsetMember.kind === 'error') {
          return <MemberFieldError key={member.key} member={fieldsetMember} />
        }
        return (
          <MemberField
            member={fieldsetMember}
            renderField={renderField}
            renderInput={renderInput}
            renderItem={renderItem}
            renderPreview={renderPreview}
            key={fieldsetMember.key}
          />
        )
      })}
    </FormFieldSet>
  )
})
