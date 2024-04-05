import {createContext} from 'react'
import type {PortableTextMemberItem} from 'sanity'

/**
 * @internal
 */
export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>([])
