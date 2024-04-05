import {type ReactNode} from 'react'
import {PortableTextMemberItemsContext} from 'sanity/_singletons'

import {type PortableTextMemberItem} from '../PortableTextInput'

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
