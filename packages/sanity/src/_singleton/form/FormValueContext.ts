import {createContext} from 'react'

import {type FormDocumentValue} from './types/formDocumentValue'

/**
 * @internal
 * @hidden
 */
export interface FormValueContextValue {
  value: FormDocumentValue | undefined
}

export const FormValueContext = createContext<FormValueContextValue | null>(null)
