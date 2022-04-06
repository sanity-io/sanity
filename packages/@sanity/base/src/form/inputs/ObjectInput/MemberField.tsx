import React, {memo} from 'react'
import {FieldMember, RenderFieldCallback} from '../../store/types'

interface Props {
  member: FieldMember
  renderField: RenderFieldCallback
}

export const MemberField = memo(function MemberField(props: Props) {
  // this is where we deal with convenience, sanity checks, error handling, etc.
  const {member, renderField} = props
  return <>{renderField(member.field)}</>
})
