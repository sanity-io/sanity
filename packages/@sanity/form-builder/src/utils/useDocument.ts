import {useContext} from 'react'
import {SanityDocument} from '@sanity/types'
import {DocumentContext, noContextValue} from '../DocumentProvider'

export function useDocument(): SanityDocument {
  const document = useContext(DocumentContext)
  if (document === noContextValue) {
    throw new Error('Could not find Sanity DocumentProvider. Please open an issue.')
  }
  return document
}
