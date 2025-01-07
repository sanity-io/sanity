import {fromPairs, toPairs} from 'lodash'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {
  DIFF_SEARCH_PARAM_SEPERATOR,
  DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_SEARCH_PARAMETER,
} from '../constants'
import {type DiffViewMode} from '../types/diffViewMode'

type NavigateDiffView = (
  options: {
    mode?: DiffViewMode
  } & Partial<
    Record<
      'previousDocument' | 'nextDocument',
      {
        type: string
        id: string
      }
    >
  >,
) => void

interface DiffViewRouter {
  navigateDiffView: NavigateDiffView
  exitDiffView: () => void
}

/**
 * @internal
 */
export function useDiffViewRouter(): DiffViewRouter {
  const {navigate, state: routerState} = useRouter()

  const navigateDiffView = useCallback<NavigateDiffView>(
    ({mode, previousDocument, nextDocument}) => {
      const next = {
        ...fromPairs(routerState._searchParams),
        ...(mode
          ? {
              [DIFF_VIEW_SEARCH_PARAMETER]: mode,
            }
          : {}),
        ...(previousDocument
          ? {
              [DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER]: [
                previousDocument.type,
                previousDocument.id,
              ].join(DIFF_SEARCH_PARAM_SEPERATOR),
            }
          : {}),
        ...(nextDocument
          ? {
              [DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER]: [nextDocument.type, nextDocument.id].join(
                DIFF_SEARCH_PARAM_SEPERATOR,
              ),
            }
          : {}),
      }

      // FIXME: Sticky params (e.g. `perspective`) are being lost here SOMETIMES.
      // ok here: http://localhost:3333/test/structure/input-debug;objectsDebug;7c71b8b7-8b6c-47a0-a6ca-e691776e8bbc?perspective=rF1jtvjXP
      // lost here: http://localhost:3333/test/structure/book;5c80b890-badc-482b-a656-3adcc2ed75f7?perspective=rCj1fA9MW
      navigate({
        ...routerState,
        _searchParams: toPairs(next),
      })
    },
    [navigate, routerState],
  )

  const exitDiffView = useCallback(() => {
    navigate({
      ...routerState,
      _searchParams: (routerState._searchParams ?? []).filter(
        ([key]) =>
          ![
            DIFF_VIEW_SEARCH_PARAMETER,
            DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
            DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
          ].includes(key),
      ),
    })
  }, [navigate, routerState])

  return {
    navigateDiffView,
    exitDiffView,
  }
}
