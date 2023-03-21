import React, {useMemo} from 'react'
import {ObjectMember} from '../../store'
import {
  RenderArrayOfObjectsItemCallback,
  RenderFieldCallback,
  RenderInputCallback,
  RenderPreviewCallback,
} from '../../types'

import {ObjectInputMember} from './ObjectInputMember'

/** @internal */
export interface ObjectMembersProps {
  members: ObjectMember[]
  renderInput: RenderInputCallback
  renderField: RenderFieldCallback
  renderItem: RenderArrayOfObjectsItemCallback
  renderPreview: RenderPreviewCallback
}

/**
 * Convenience component for wrapping an object input
 * @internal
 */
export function ObjectInputMembers(props: ObjectMembersProps) {
  const {members, renderField, renderInput, renderItem, renderPreview} = props

  const renderMembers = useMemo(
    () =>
      members.map((member) => (
        <ObjectInputMember
          key={member.key}
          member={member}
          renderField={renderField}
          renderInput={renderInput}
          renderItem={renderItem}
          renderPreview={renderPreview}
        />
      )),
    [members, renderField, renderInput, renderItem, renderPreview]
  )

  return <>{renderMembers}</>
}

/**
 * @deprecated Use ObjectInputMembers instead
 * @internal
 */
export const ObjectMembers = ObjectInputMembers
