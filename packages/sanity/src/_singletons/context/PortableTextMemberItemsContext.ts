import {createContext} from 'react'

import type {PortableTextMemberItem} from '../../../../../core/form/inputs/PortableText/PortableTextInput'

/**
 * @internal
 */
export const PortableTextMemberItemsContext = createContext<PortableTextMemberItem[]>([])
