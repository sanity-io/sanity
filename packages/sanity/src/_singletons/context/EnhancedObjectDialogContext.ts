import {createContext} from 'sanity/_createContext'

import type {EnhancedObjectDialogContextValue} from '../../core/form/studio/tree-editing/context/enabled/useEnhancedObjectDialog'

/**
 * @internal
 * @deprecated This context is no longer used and will be removed in a future release as we make the enhanced object dialog the default.
 */
export const EnhancedObjectDialogContext = createContext<EnhancedObjectDialogContextValue>(
  'sanity/_singletons/context/enhanced-object-dialog-enabled',
  {
    enabled: false,
    legacyEditing: false,
  },
)
