import {createContext} from 'react'

import type {TreeEditingEnabledContextValue} from '../../../../core/form/studio/tree-editing/context/enabled/useTreeEditingEnabled'

/**
 * @internal
 */
export const TreeEditingEnabledContext = createContext<TreeEditingEnabledContextValue>({
  enabled: false,
  legacyEditing: false,
})
