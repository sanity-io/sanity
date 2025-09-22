import {useEffect} from 'react'
import {type RouterState} from 'sanity/router'

import {type DocumentResolver, type MainDocumentState, type PresentationNavigate} from './types'
import {useMainDocument} from './useMainDocument'

interface MainDocumentStateProviderProps {
  navigate?: PresentationNavigate
  navigationHistory: RouterState[]
  path?: string
  targetOrigin: string
  resolvers?: DocumentResolver[]
  onMainDocumentState: (state: MainDocumentState | undefined) => void
}

export function MainDocumentStateProvider({
  navigate,
  navigationHistory,
  path,
  targetOrigin,
  resolvers,
  onMainDocumentState,
}: MainDocumentStateProviderProps): null {
  const mainDocumentState = useMainDocument({
    navigate,
    navigationHistory,
    path,
    targetOrigin,
    resolvers,
  })

  useEffect(() => {
    onMainDocumentState(mainDocumentState)
  }, [mainDocumentState, onMainDocumentState])

  return null
}
