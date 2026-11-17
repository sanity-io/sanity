import {use} from 'react'
import {FormBuilderContext} from 'sanity/_singletons'

import {type FormBuilderContextValue} from './FormBuilderContext'

/**
 *
 * @hidden
 * @beta
 */
export function useFormBuilder(): FormBuilderContextValue {
  const formBuilder = use(FormBuilderContext)

  if (!formBuilder) {
    throw new Error('FormBuilder: missing context value')
  }

  return formBuilder
}
