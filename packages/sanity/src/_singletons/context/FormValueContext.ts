import type {FormValueContextValue} from '../../core/form/contexts/FormValue'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const FormValueContext = createContext<FormValueContextValue | null>(
  'sanity/_singletons/context/form-value',
  null,
)
