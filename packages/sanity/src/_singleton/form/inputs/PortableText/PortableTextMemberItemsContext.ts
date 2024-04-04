import {createContext} from 'react'

import {type PortableTextMemberItem} from './types'

/**
 * @internal
 * @hidden
 */
export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>([])
