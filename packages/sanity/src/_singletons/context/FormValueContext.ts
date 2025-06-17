import {createContext} from 'sanity/_createContext'

import type {FormValueContextValue} from '../../core/form/contexts/FormValue'

/**
 * @internal
 */
export const FormValueContext: React.Context<FormValueContextValue | null> =
  createContext<FormValueContextValue | null>('sanity/_singletons/context/form-value', null)
