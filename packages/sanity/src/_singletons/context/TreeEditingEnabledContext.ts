import {createContext} from 'sanity/_createContext'

import type {TreeEditingEnabledContextValue} from '../../core/form/studio/tree-editing/context/enabled/useTreeEditingEnabled'

/**
 * @internal
 */
export const TreeEditingEnabledContext: React.Context<TreeEditingEnabledContextValue> =
  createContext<TreeEditingEnabledContextValue>('sanity/_singletons/context/tree-editing-enabled', {
    enabled: false,
    legacyEditing: false,
  })
