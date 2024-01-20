import {createContext, type ReactNode} from 'react'

import {type PortableTextMemberItem} from '../PortableTextInput'

export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>([])

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
