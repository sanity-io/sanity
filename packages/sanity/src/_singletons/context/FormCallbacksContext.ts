import type {FormCallbacksValue} from '../../core/form/studio/contexts/FormCallbacks'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const FormCallbacksContext = createContext<FormCallbacksValue | null>(
  'sanity/_singletons/context/form-callbacks',
  null,
)
