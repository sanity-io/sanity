import {createContext} from 'react'

import type {FormCallbacksValue} from '../../../../core/form/studio/contexts/FormCallbacks'

/**
 * @internal
 */
export const FormCallbacksContext = createContext<FormCallbacksValue | null>(null)
