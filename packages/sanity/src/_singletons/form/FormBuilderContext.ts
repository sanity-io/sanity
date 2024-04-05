import {createContext} from 'react'
import type {FormBuilderContextValue} from 'sanity'

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
