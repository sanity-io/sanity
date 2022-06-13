import React from 'react'
import {ObjectMember} from '../store'
import {
  RenderInputCallback,
  RenderFieldCallback,
  RenderPreviewCallback,
  RenderArrayOfObjectsItemCallback,
} from '../types'

import {MemberField} from './MemberField'
import {MemberFieldError} from './MemberFieldError'
import {MemberFieldSet} from './MemberFieldset'

export interface ObjectMembersProps {
  members: ObjectMember[]
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

export function ObjectMembers(props: ObjectMembersProps) {
  const {members, renderInput, renderField, renderItem, renderPreview} = props
  return (
    <>
      {members.map((member) => {
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
      })}
    </>
  )
}
