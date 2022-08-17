import React from 'react'
import {ArrayOfObjectsMember} from '../store'
import {
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../types'

import {ArrayOfObjectsItem} from './items/ArrayOfObjectsItem'
import {MemberItemError} from './MemberItemError'

export interface ArrayOfObjectsMembersProps {
  members: ArrayOfObjectsMember[]
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/**
 * Convenience component for wrapping an array of objects
 * @beta
 */
export function ArrayOfObjectsMembers(props: ArrayOfObjectsMembersProps) {
  const {members, renderInput, renderField, renderItem, renderPreview} = props
  return (
    <>
      {members.map((member) => {
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
      })}
    </>
  )
}
