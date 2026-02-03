import {createContext} from 'sanity/_createContext'

import type {FormCallbacksValue} from '../../core/form/studio/contexts/FormCallbacks'

/**
 * @internal
 */
export const FormCallbacksContext = createContext<FormCallbacksValue | null>(
  'sanity/_singletons/context/form-callbacks',
  null,
)
