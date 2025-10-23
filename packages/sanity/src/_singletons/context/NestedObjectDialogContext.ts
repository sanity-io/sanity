import {createContext} from 'sanity/_createContext'

import type {NestedObjectDialogContextValue} from '../../core/form/studio/tree-editing/context/enabled/useNestedObjectDialog'

/**
 * @internal
 */
export const NestedObjectDialogContext = createContext<NestedObjectDialogContextValue>(
  'sanity/_singletons/context/nested-object-dialog-enabled',
  {
    enabled: false,
    legacyEditing: false,
  },
)
