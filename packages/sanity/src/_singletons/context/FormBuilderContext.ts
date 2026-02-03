import type {FormBuilderContextValue} from '../../core/form/FormBuilderContext'
import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export const FormBuilderContext = createContext<FormBuilderContextValue | null>(
  'sanity/_singletons/context/form-builder',
  null,
)
