import * as React from 'react'
import {memo, useRef} from 'react'
import {ArrayMember} from '../../../store/types'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {RenderArrayItemCallback} from '../../../types_v3'

interface Props {
  member: ArrayMember
  renderItem: RenderArrayItemCallback
}

export const ItemMember = memo(function ItemMember(props: Props) {
  const focusRef = useRef<{focus: () => void}>()
  // this is where we deal with convenience, sanity checks, error handling, etc.
  const {member, renderItem} = props

  useDidUpdate(member.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  return <>{renderItem({...member, focusRef})}</>
})
