import {createContext} from 'react'

import type {TreeEditingEnabledContextValue} from './types'

/**
 * @internal
 */
export const TreeEditingEnabledContext = createContext<TreeEditingEnabledContextValue>({
  enabled: false,
  legacyEditing: false,
})
