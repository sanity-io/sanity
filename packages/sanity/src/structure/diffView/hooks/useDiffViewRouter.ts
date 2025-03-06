import {fromPairs, toPairs} from 'lodash'
import {useCallback} from 'react'
import {useRouter} from 'sanity/router'

import {
  DIFF_SEARCH_PARAM_DELIMITER,
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

export interface DiffViewRouter {
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
              ].join(DIFF_SEARCH_PARAM_DELIMITER),
            }
          : {}),
        ...(nextDocument
          ? {
              [DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER]: [nextDocument.type, nextDocument.id].join(
                DIFF_SEARCH_PARAM_DELIMITER,
              ),
            }
          : {}),
      }

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
