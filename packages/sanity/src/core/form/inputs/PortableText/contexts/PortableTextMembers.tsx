import {type PortableTextMemberItem} from '../PortableTextInput'
import {type ReactNode} from 'react'
import {PortableTextMemberItemsContext} from 'sanity/_singletons'

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
