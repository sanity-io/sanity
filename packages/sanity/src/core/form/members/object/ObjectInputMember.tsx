import React, {memo} from 'react'
import {ObjectMember} from '../../store'
import {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'

import {MemberField} from './MemberField'
import {MemberFieldError} from './MemberFieldError'
import {MemberFieldSet} from './MemberFieldset'

/** @internal */
export interface ObjectInputMemberProps {
  member: ObjectMember
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/** @internal */
export const ObjectInputMember = memo(function ObjectInputMember(props: ObjectInputMemberProps) {
  const {
    member,
    renderAnnotation,
    renderBlock,
    renderInput,
    renderInlineBlock,
    renderField,
    renderItem,
    renderPreview,
  } = props

  if (member.kind === 'field') {
    return (
      <MemberField
        key={member.key}
        member={member}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderInlineBlock={renderInlineBlock}
        renderInput={renderInput}
        renderField={renderField}
        renderItem={renderItem}
        renderPreview={renderPreview}
      />
    )
  }
  if (member.kind === 'error') {
    return <MemberFieldError key={member.key} member={member} />
  }
  if (member.kind === 'fieldSet') {
    return (
      <MemberFieldSet
        key={member.key}
        member={member}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderInlineBlock={renderInlineBlock}
        renderInput={renderInput}
        renderField={renderField}
        renderItem={renderItem}
        renderPreview={renderPreview}
      />
    )
  }
  //@ts-expect-error The branching above should cover all possible cases
  console.warn(new Error(`Unhandled member kind ${member.kind}`))
  return null
})
