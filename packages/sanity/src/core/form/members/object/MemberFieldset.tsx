import {capitalize} from 'lodash-es'
import {memo, useCallback, useMemo} from 'react'

import {FormFieldSet} from '../../components/formField/FormFieldSet'
import type {FieldSetMember} from '../../store/types/members'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import type {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types/renderCallback'
import {MemberDecoration} from './MemberDecoration'
import {MemberField} from './MemberField'
import {MemberFieldError} from './MemberFieldError'

/** @internal */
export const MemberFieldSet = memo(function MemberFieldSet(props: {
  member: FieldSetMember
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}) {
  const {
    member,
    renderAnnotation,
    renderBlock,
    renderField,
    renderInlineBlock,
    renderInput,
    renderItem,
    renderPreview,
  } = props

  const {onSetFieldSetCollapsed} = useFormCallbacks()

  const handleCollapse = useCallback(() => {
    onSetFieldSetCollapsed(member.fieldSet.path, true)
  }, [member.fieldSet.path, onSetFieldSetCollapsed])

  const handleExpand = useCallback(() => {
    onSetFieldSetCollapsed(member.fieldSet.path, false)
  }, [member.fieldSet.path, onSetFieldSetCollapsed])

  const fieldsetMembers = useMemo(() => {
    if (member.renderMembers) {
      return member.renderMembers(member.fieldSet.members)
    }
    return member.fieldSet.members
  }, [member])

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
      inputId={member.fieldSet.name}
    >
      {fieldsetMembers.map((fieldsetMember) => {
        if (fieldsetMember.kind === 'error') {
          return <MemberFieldError key={member.key} member={fieldsetMember} />
        }
        if (fieldsetMember.kind === 'decoration') {
          return <MemberDecoration key={fieldsetMember.key} member={fieldsetMember} />
        }
        return (
          <MemberField
            key={fieldsetMember.key}
            member={fieldsetMember}
            renderAnnotation={renderAnnotation}
            renderBlock={renderBlock}
            renderField={renderField}
            renderInlineBlock={renderInlineBlock}
            renderInput={renderInput}
            renderItem={renderItem}
            renderPreview={renderPreview}
          />
        )
      })}
    </FormFieldSet>
  )
})
