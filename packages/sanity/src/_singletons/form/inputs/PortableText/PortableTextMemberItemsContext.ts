import {createContext} from 'react'
import type {PortableTextMemberItem} from 'sanity'

export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>([])
