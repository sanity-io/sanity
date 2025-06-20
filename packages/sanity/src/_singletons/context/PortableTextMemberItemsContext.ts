import {createContext} from 'sanity/_createContext'

import type {PortableTextMemberItem} from '../../core/form/inputs/PortableText/PortableTextInput'

/**
 * @internal
 */
export const PortableTextMemberItemsContext: React.Context<PortableTextMemberItem[]> =
  createContext<PortableTextMemberItem[]>(
    'sanity/_singletons/context/portable-text-member-items',
    [],
  )
