import React from 'react'
import {ObjectMember} from '../../store'
import {
  RenderArrayOfObjectsItemCallback,
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
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/** @internal */
export function ObjectInputMember(props: ObjectInputMemberProps) {
  const {member, renderInput, renderField, renderItem, renderPreview} = props

  if (member.kind === 'field') {
    return (
      <MemberField
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
    return <MemberFieldError key={member.key} member={member} />
  }
  if (member.kind === 'fieldSet') {
    return (
      <MemberFieldSet
        key={member.key}
        member={member}
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
}
