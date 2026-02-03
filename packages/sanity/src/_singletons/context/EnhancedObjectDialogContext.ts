import type {EnhancedObjectDialogContextValue} from '../../core/form/studio/tree-editing/context/enabled/useEnhancedObjectDialog'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const EnhancedObjectDialogContext = createContext<EnhancedObjectDialogContextValue>(
  'sanity/_singletons/context/enhanced-object-dialog-enabled',
  {
    enabled: false,
    legacyEditing: false,
  },
)
