import {useContext} from 'react'
import {FormNodeContext, FormNodeContextValue} from './FormNodeContext'

/**
 * @alpha
 */
export function useFormNode<T = unknown>(): FormNodeContextValue<T> {
  const formNode = useContext(FormNodeContext)

  if (!formNode) {
    throw new Error('FormNode: missing context value')
  }

  return formNode as FormNodeContextValue<T>
}
