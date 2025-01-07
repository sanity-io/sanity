import {useRouter} from 'sanity/router'

import {
  DIFF_SEARCH_PARAM_SEPERATOR,
  DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER,
  DIFF_VIEW_SEARCH_PARAMETER,
} from '../constants'
import {type DiffViewMode, diffViewModes} from '../types/diffViewMode'

function isDiffViewMode(maybeDiffViewMode: unknown): maybeDiffViewMode is DiffViewMode {
  return diffViewModes.includes(maybeDiffViewMode as DiffViewMode)
}

type DiffViewState =
  | {
      isActive: true
      state: 'ready'
      mode: DiffViewMode
      documents: Record<
        'previous' | 'next',
        {
          type: string
          id: string
        }
      >
    }
  | {
      isActive: true
      state: 'pending' | 'error'
      mode: DiffViewMode
      documents?: never
    }
  | {
      isActive: false
      state?: never
      mode?: never
      documents?: never
    }

export function useDiffViewState(): DiffViewState {
  const {state: routerState} = useRouter()
  const searchParams = new URLSearchParams(routerState._searchParams)
  const diffViewMode = searchParams.get(DIFF_VIEW_SEARCH_PARAMETER)

  // TODO: Validate parameters.
  // - Ensure not `""`.
  // - Ensure not `null`.
  // - Ensure types are present in schema.
  const [previousDocumentType, previousDocumentId] = (
    searchParams.get(DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER) ?? ''
  ).split(DIFF_SEARCH_PARAM_SEPERATOR)

  const [nextDocumentType, nextDocumentId] = (
    searchParams.get(DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER) ?? ''
  ).split(DIFF_SEARCH_PARAM_SEPERATOR)

  if (!isDiffViewMode(diffViewMode)) {
    // TODO: Improve handling.
    if (typeof diffViewMode === 'string') {
      console.warn(`Not a valid diff view: "${diffViewMode}".`)
    }
    return {
      isActive: false,
    }
  }

  return {
    state: 'ready',
    isActive: true,
    mode: diffViewMode,
    documents: {
      previous: {
        type: previousDocumentType,
        id: previousDocumentId,
      },
      next: {
        type: nextDocumentType,
        id: nextDocumentId,
      },
    },
  }
}
