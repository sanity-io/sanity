import {useContext} from 'react'
import {FormBuilderContext, FormBuilderContextValue} from './FormBuilderContext'

/**
 * @alpha
 */
export function useFormBuilder(): FormBuilderContextValue {
  const formBuilder = useContext(FormBuilderContext)

  if (!formBuilder) {
    throw new Error('FormBuilder: missing context value')
  }

  return formBuilder
}
