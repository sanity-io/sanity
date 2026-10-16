import {createContext} from 'react'

import type {RecordDocumentHistoryEvent} from '../../core/hooks/useDocumentHistoryRecorder'

/**
 * @internal
 */
export const DocumentHistoryContext = createContext<RecordDocumentHistoryEvent>(() => {})
