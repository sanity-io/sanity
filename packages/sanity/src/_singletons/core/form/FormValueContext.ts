import {createContext} from 'react'

import type {FormValueContextValue} from '../../../core/form/contexts/FormValue'

/**
 * @internal
 */
export const FormValueContext = createContext<FormValueContextValue | null>(null)
