import {useContext} from 'react'
import {PortableTextMemberItemsContext} from '../contexts/PortableTextMembers'
import {PortableTextMemberItem} from '../PortableTextInput'

export function usePortableTextMemberItem(key: string): PortableTextMemberItem | undefined {
  const ctx = useContext(PortableTextMemberItemsContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx.find((m) => m.key === key)
}

export function usePortableTextMemberItems(): PortableTextMemberItem[] {
  const ctx = useContext(PortableTextMemberItemsContext)
  if (!ctx) {
    throw new Error('Form context not provided')
  }
  return ctx
}
