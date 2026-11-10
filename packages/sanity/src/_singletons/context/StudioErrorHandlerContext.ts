import {createContext} from 'react'

import type {StudioErrorHandler} from '../../core/studio/requestErrors/types'

/** @internal */
export const StudioErrorHandlerContext = createContext<StudioErrorHandler | null>(null)
