import React from 'react'
import {ArrayOfObjectsMember} from '../../store'
import {
  RenderAnnotationCallback,
  RenderArrayOfObjectsItemCallback,
  RenderBlockCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'

import {ArrayOfObjectsItem} from './items/ArrayOfObjectsItem'
import {MemberItemError} from './MemberItemError'

/** @internal */
export interface ArrayOfObjectsMemberProps {
  member: ArrayOfObjectsMember
  renderAnnotation?: RenderAnnotationCallback
  renderBlock?: RenderBlockCallback
  renderField: RenderFieldCallback
  renderInlineBlock?: RenderBlockCallback
  renderInput: RenderInputCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/**
 * Convenience component for rendering an "array of objects"-item
 * @internal
 */
export function ArrayOfObjectsInputMember(props: ArrayOfObjectsMemberProps) {
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
  if (member.kind === 'item') {
    return (
      <ArrayOfObjectsItem
        key={member.key}
        member={member}
        renderAnnotation={renderAnnotation}
        renderBlock={renderBlock}
        renderField={renderField}
        renderInlineBlock={renderInlineBlock}
        renderInput={renderInput}
        renderItem={renderItem}
        renderPreview={renderPreview}
      />
    )
  }
  if (member.kind === 'error') {
    return <MemberItemError key={member.key} member={member} />
  }

  //@ts-expect-error The branching above should cover all possible cases
  console.warn(new Error(`Unhandled member kind ${member.kind}`))
  return null
}
