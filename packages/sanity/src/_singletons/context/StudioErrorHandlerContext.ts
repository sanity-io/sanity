import {createContext} from 'sanity/_createContext'

import type {StudioErrorHandler} from '../../core/studio/requestErrors/types'

/** @internal */
export const StudioErrorHandlerContext = createContext<StudioErrorHandler | null>(
  'sanity/_singletons/context/request-error-reporter',
  null,
)
