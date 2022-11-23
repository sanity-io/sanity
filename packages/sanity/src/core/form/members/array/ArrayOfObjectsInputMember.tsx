import React from 'react'
import {ArrayOfObjectsMember} from '../../store'
import {
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'

import {ArrayOfObjectsItem} from './items/ArrayOfObjectsItem'
import {MemberItemError} from './MemberItemError'

/** @internal */
export interface ArrayOfObjectsMemberProps {
  member: ArrayOfObjectsMember
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/**
 * Convenience component for rendering an "array of objects"-item
 * @internal
 */
export function ArrayOfObjectsInputMember(props: ArrayOfObjectsMemberProps) {
  const {member, renderInput, renderField, renderItem, renderPreview} = props
  if (member.kind === 'item') {
    return (
      <ArrayOfObjectsItem
        key={member.key}
        member={member}
        renderInput={renderInput}
        renderField={renderField}
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
