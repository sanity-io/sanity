import {createContext} from 'react'

import type {FormBuilderContextValue} from '../../../core/form/FormBuilderContext'

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(null)
