import {createContext} from 'sanity/_createContext'

import type {RequestPerformanceTracker} from '../../core/studio/diagnostics/requestPerformance'

/** @internal */
export const RequestPerformanceContext = createContext<RequestPerformanceTracker | undefined>(
  'sanity/_singletons/context/request-performance',
  undefined,
)
