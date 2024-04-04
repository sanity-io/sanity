import {type ReactNode} from 'react'
import {type PortableTextMemberItem, PortableTextMemberItemsContext} from 'sanity/_singleton'

export function PortableTextMemberItemsProvider(props: {
  memberItems: PortableTextMemberItem[]
  children: ReactNode
}) {
  return (
    <PortableTextMemberItemsContext.Provider value={props.memberItems}>
      {props.children}
    </PortableTextMemberItemsContext.Provider>
  )
}
