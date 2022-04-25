import * as React from 'react'
import {memo, useRef} from 'react'
import {ArrayItemMember, RenderArrayItemCallback} from '../../../types'
import {useDidUpdate} from '../../../hooks/useDidUpdate'

interface Props {
  member: ArrayItemMember
  renderItem: RenderArrayItemCallback
}

export const ItemMember = memo(function ItemMember(props: Props) {
  const focusRef = useRef<{focus: () => void}>()
  // this is where we deal with convenience, sanity checks, error handling, etc.
  const {member, renderItem} = props

  useDidUpdate(member.item.focused, (hadFocus, hasFocus) => {
    if (!hadFocus && hasFocus) {
      focusRef.current?.focus()
    }
  })

  return <>{renderItem({...member.item, focusRef})}</>
})
