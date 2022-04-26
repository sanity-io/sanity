import React, {memo, useRef} from 'react'
import {useDidUpdate} from '../../hooks/useDidUpdate'
import {FieldMember, RenderFieldCallback} from '../../types'
import {useFormBuilder} from '../../useFormBuilder'
import {ChangeIndicatorProvider} from '../../../components/changeIndicators'
import {Focusable} from '../../types/focusable'

export interface MemberFieldProps {
  member: FieldMember
  renderField?: RenderFieldCallback
}

// this is where we deal with convenience, sanity checks, error handling, etc.
export const MemberField = memo(function MemberField(props: MemberFieldProps) {
  const {renderField: defaultRenderField} = useFormBuilder()
  const {member, renderField = defaultRenderField} = props
  const focusRef = useRef<Focusable | null>(null)

  useDidUpdate(member.field.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  return (
    <ChangeIndicatorProvider
      path={member.field.path}
      value={member.field.value}
      compareValue={undefined}
    >
      {renderField(member.field, focusRef)}
    </ChangeIndicatorProvider>
  )
})
