import {useContext} from 'react'
import {RequestPerformanceContext} from 'sanity/_singletons'

import {type RequestPerformanceTracker} from './requestPerformance'

/** @internal */
export function useRequestPerformanceTracker(): RequestPerformanceTracker | undefined {
  return useContext(RequestPerformanceContext)
}
