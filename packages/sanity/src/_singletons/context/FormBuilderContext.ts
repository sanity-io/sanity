import {createContext} from 'sanity/_createContext'

import type {FormBuilderContextValue} from '../../core/form/FormBuilderContext'

/**
 * @internal
 */
export const FormBuilderContext: React.Context<FormBuilderContextValue | null> =
  createContext<FormBuilderContextValue | null>('sanity/_singletons/context/form-builder', null)
