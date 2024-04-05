import {createContext} from 'react'
import type {FormCallbacksValue} from 'sanity'

/**
 * @internal
 */
export const FormCallbacksContext = createContext<FormCallbacksValue | null>(null)
