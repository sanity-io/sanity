import {type SchemaType} from '@sanity/types'
import capitalize from 'lodash-es/capitalize.js'
import {memo, useCallback, useContext, useMemo} from 'react'
import {FieldSetRollupContext} from 'sanity/_singletons'

import {FormFieldSet} from '../../components/formField/FormFieldSet'
import {type FieldSetMember} from '../../store/types/members'
import {useFormCallbacks} from '../../studio/contexts/FormCallbacks'
import {
  type RenderAnnotationCallback,
  type RenderArrayOfObjectsItemCallback,
  type RenderBlockCallback,
  type RenderFieldCallback,
  type RenderInputCallback,
  type RenderPreviewCallback,
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
  schemaType?: SchemaType
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
    schemaType,
  } = props

  const {onSetFieldSetCollapsed} = useFormCallbacks()
  const renderRollup = useContext(FieldSetRollupContext)

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

  // PROPOSED: a roll-up mark for the fields in this field set, drawn in its header (nothing without a provider).
  const rollup = renderRollup
    ? renderRollup({
        name: member.fieldSet.name,
        path: member.path,
        fieldPaths: member.fieldSet.members.flatMap((m) =>
          m.kind === 'field' ? [m.field.path] : [],
        ),
        collapsed: Boolean(member.fieldSet.collapsed),
      })
    : null

  return (
    <FormFieldSet
      // oxlint-disable-next-line no-deprecated -- the header slot is the only place a field set can carry a mark
      __internal_slot={rollup}
      title={member.fieldSet.title || capitalize(member.fieldSet.name)}
      description={member.fieldSet.description}
      level={member.fieldSet.level}
      collapsible={member.fieldSet.collapsible}
      collapsed={member.fieldSet.collapsed}
      onCollapse={handleCollapse}
      onExpand={handleExpand}
      schemaType={schemaType}
      columns={member?.fieldSet?.columns}
      data-testid={`fieldset-${member.fieldSet.name}`}
      inputId={member.fieldSet.name}
      path={member.path}
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
