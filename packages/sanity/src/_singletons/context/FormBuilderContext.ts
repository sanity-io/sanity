import {createContext} from 'sanity/_createContext'

import type {FormBuilderContextValue} from '../../core/form/FormBuilderContext'

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(
  'sanity/_singletons/context/form-builder',
  null,
)
