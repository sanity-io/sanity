import {createContext} from 'sanity/_createContext'

import type {PortableTextMemberItem} from '../../core/form/inputs/PortableText/PortableTextInput'

/**
 * @internal
 */
export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>(
  'sanity/_singletons/context/portable-text-member-items',
  [],
)
