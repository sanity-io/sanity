import {createContext} from 'react'
import type {FormValueContextValue} from 'sanity'

/**
 * @internal
 */
export const FormValueContext = createContext<FormValueContextValue | null>(null)
