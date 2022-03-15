import {useContext} from 'react'
import {SanityContext, SanityContextValue} from './SanityContext'

export function useSanity(): SanityContextValue {
  const sanity = useContext(SanityContext)

  if (!sanity) {
    throw new Error('Sanity: missing context value')
  }

  return sanity
}
