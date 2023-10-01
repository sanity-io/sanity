import {SanityDocumentLike} from '@sanity/types'
import {useContext} from 'react'
import {DocumentContextError} from '../DocumentContextError'
import {FormStateContext, FormStateContextValue} from './FormStateContext'

/** @internal */
export function useFormState<
  TDocument extends SanityDocumentLike = SanityDocumentLike,
>(): FormStateContextValue<TDocument> {
  const context = useContext(FormStateContext)
  if (!context) throw new DocumentContextError()

  return context as FormStateContextValue<TDocument>
}
