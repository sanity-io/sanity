import {useContext} from 'react'
import {PresentationNavigateContext} from 'sanity/_singletons'

import {type PresentationNavigateContextValue} from './types'

/** @public */
export function usePresentationNavigate(): PresentationNavigateContextValue {
  const navigate = useContext(PresentationNavigateContext)

  if (!navigate) {
    throw new Error('Presentation navigate context is missing')
  }

  return navigate
}

export type {PresentationNavigateContextValue}
