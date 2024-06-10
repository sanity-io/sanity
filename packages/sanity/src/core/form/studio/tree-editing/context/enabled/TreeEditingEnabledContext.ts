// todo: move to _singletons
// eslint-disable-next-line no-restricted-imports
import {createContext} from 'react'

import {type TreeEditingEnabledContextValue} from './types'

export const TreeEditingEnabledContext = createContext<TreeEditingEnabledContextValue>({
  enabled: false,
  legacyEditing: false,
})
