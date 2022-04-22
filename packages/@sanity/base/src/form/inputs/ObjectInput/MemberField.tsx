import React, {memo, useRef} from 'react'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {RenderFieldCallback} from '../../types_v3'
import {FieldMember} from '../../store/types'

interface Props {
  member: FieldMember
  renderField: RenderFieldCallback
}

export const MemberField = memo(function MemberField(props: Props) {
  const focusRef = useRef<{focus: () => void}>()
  // this is where we deal with convenience, sanity checks, error handling, etc.
  const {member, renderField} = props

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  return <>{renderField({...member.field, focusRef})}</>
})
