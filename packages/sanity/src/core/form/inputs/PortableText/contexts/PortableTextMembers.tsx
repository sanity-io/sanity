import {ReactNode, createContext} from 'react'
import {PortableTextMemberItem} from '../PortableTextInput'

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
