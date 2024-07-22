import {createContext} from 'react'

import type {LegacyArrayEditingContextValue} from '../../../../core/form/studio/array-editing/context/enabled/useLegacyArrayEditing'

/**
 * @internal
 */
export const LegacyArrayEditingContext = createContext<LegacyArrayEditingContextValue>({
  enabled: false,
})
