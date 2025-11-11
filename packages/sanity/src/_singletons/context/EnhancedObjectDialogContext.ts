import {createContext} from 'sanity/_createContext'

import type {EnhancedObjectDialogContextValue} from '../../core/form/studio/tree-editing/context/enabled/useEnhancedObjectDialog'

/**
 * @internal
 */
export const EnhancedObjectDialogContext = createContext<EnhancedObjectDialogContextValue>(
  'sanity/_singletons/context/enhanced-object-dialog-enabled',
  {
    enabled: false,
    isDialogAvailable: false,
    legacyEditing: false,
  },
)
