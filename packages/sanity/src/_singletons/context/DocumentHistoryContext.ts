import {createContext} from 'sanity/_createContext'

import type {RecordDocumentHistoryEvent} from '../../core/hooks/useDocumentHistoryRecorder'

/**
 * @internal
 */
export const DocumentHistoryContext = createContext<RecordDocumentHistoryEvent>(
  'sanity/_singletons/context/document-history',
  () => {},
)
