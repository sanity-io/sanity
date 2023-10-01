import {SanityDocumentLike} from '@sanity/types'
import {useContext} from 'react'
import {DocumentContextError} from '../DocumentContextError'
import {InitialValueContext} from './InitialValueContext'

/**
 * @internal
 */
export function useInitialValue<
  TDocument extends SanityDocumentLike = SanityDocumentLike,
>(): TDocument {
  const initialValue = useContext(InitialValueContext)
  if (!initialValue) throw new DocumentContextError()

  return initialValue as TDocument
}
