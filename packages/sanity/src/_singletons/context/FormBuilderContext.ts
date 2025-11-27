import {type Context} from 'react'
import {createContext} from 'sanity/_createContext'

import type {FormBuilderContextValue} from '../../core/form/FormBuilderContext'

/**
 * @internal
 */
export const FormBuilderContext: Context<FormBuilderContextValue | null> =
  createContext<FormBuilderContextValue | null>('sanity/_singletons/context/form-builder', null)
