import {type FunctionComponent, type PropsWithChildren, useCallback} from 'react'
import {PresentationNavigateContext} from 'sanity/_singletons'

import {
  type CombinedSearchParams,
  type PresentationNavigate,
  type PresentationNavigateContextValue,
  type PresentationNavigateOptions,
  type PresentationStateParams,
} from './types'

export const PresentationNavigateProvider: FunctionComponent<
  PropsWithChildren<{
    navigate: PresentationNavigate
  }>
> = function (props) {
  const {children, navigate: _navigate} = props

  const navigate = useCallback<PresentationNavigateContextValue>(
    (preview, document) => {
      if (preview || document) {
        const obj: {
          state?: PresentationStateParams
          params?: CombinedSearchParams
        } = {}
        if (preview) obj.params = {preview}
        if (document) obj.state = document
        // Cast because navigate expects either params or state to be defined, which we guarantee above
        _navigate(obj as PresentationNavigateOptions)
      }
    },
    [_navigate],
  )

  return (
    <PresentationNavigateContext.Provider value={navigate}>
      {children}
    </PresentationNavigateContext.Provider>
  )
}
