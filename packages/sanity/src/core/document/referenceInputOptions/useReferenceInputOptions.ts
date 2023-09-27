import {useContext} from 'react'
import {DocumentContextError} from '../DocumentContextError'
import {
  ReferenceInputOptionsContext,
  ReferenceInputOptionsContextValue,
} from './ReferenceInoutOptionsContext'

/** @internal */
export function useReferenceInputOptions(): ReferenceInputOptionsContextValue {
  const context = useContext(ReferenceInputOptionsContext)
  if (!context) throw new DocumentContextError()
  return context
}
