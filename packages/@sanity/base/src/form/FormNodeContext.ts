import {createContext} from 'react'

export interface FormNodeContextValue {
  id: string
}

export const FormNodeContext = createContext<FormNodeContextValue | null>(null)
