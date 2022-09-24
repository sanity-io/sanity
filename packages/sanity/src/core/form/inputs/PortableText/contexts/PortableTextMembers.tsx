import React, {createContext} from 'react'
import {PortableTextMemberItem} from '../PortableTextInput'

export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>([])

export function PortableTextMemberItemsProvider(props: {
  memberItems: PortableTextMemberItem[]
  children: React.ReactNode
}) {
  return (
    <PortableTextMemberItemsContext.Provider value={props.memberItems}>
      {props.children}
    </PortableTextMemberItemsContext.Provider>
  )
}
