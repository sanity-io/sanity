import {useContext} from 'react'
import {
  FormRenderCallbacksContext,
  FormRenderCallbacksContextValue,
} from './FormRenderCallbacksContext'

export function useFormRenderCallbacks(): FormRenderCallbacksContextValue {
  const renderCallbacks = useContext(FormRenderCallbacksContext)

  if (!renderCallbacks) {
    throw new Error('FormRenderCallbacks: missing context value')
  }

  return renderCallbacks
}
