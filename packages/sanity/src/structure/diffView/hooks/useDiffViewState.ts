import {useEffect, useMemo} from 'react'
import {useRouter} from 'sanity/router'

import {
  DIFF_SEARCH_PARAM_DELIMITER,
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
      state: 'error'
      mode: DiffViewMode
      documents?: never
    }
  | {
      isActive: false
      state?: never
      mode?: never
      documents?: never
    }

export function useDiffViewState({
  onParamsError,
}: {
  onParamsError?: (errors: DiffViewStateErrorWithInput[]) => void
} = {}): DiffViewState {
  const {state: routerState} = useRouter()
  const searchParams = new URLSearchParams(routerState._searchParams)
  const previousDocument = searchParams.get(DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER)
  const nextDocument = searchParams.get(DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER)
  const mode = searchParams.get(DIFF_VIEW_SEARCH_PARAMETER)
  const anyParamSet = [previousDocument, nextDocument, mode].some((param) => param !== null)

  const params = useMemo(
    () =>
      parseParams({
        previousDocument: previousDocument ?? '',
        nextDocument: nextDocument ?? '',
        mode: mode ?? '',
      }),
    [mode, nextDocument, previousDocument],
  )

  useEffect(() => {
    if (params.result === 'error' && anyParamSet) {
      onParamsError?.(params.errors)
    }
  }, [anyParamSet, onParamsError, params])

  if (params.result === 'error') {
    return {
      isActive: false,
    }
  }

  return {
    state: 'ready',
    isActive: true,
    ...params.params,
  }
}

type DiffViewStateError =
  | 'invalidModeParam'
  | 'invalidPreviousDocumentParam'
  | 'invalidNextDocumentParam'

type DiffViewStateErrorWithInput = [error: DiffViewStateError, input: unknown]

interface ParamsSuccess {
  result: 'success'
  params: Pick<DiffViewState & {state: 'ready'}, 'mode' | 'documents'>
}

interface ParamsError {
  result: 'error'
  errors: DiffViewStateErrorWithInput[]
}

function parseParams({
  previousDocument,
  nextDocument,
  mode,
}: {
  previousDocument: string
  nextDocument: string
  mode: string
}): ParamsSuccess | ParamsError {
  const errors: DiffViewStateErrorWithInput[] = []

  const [previousDocumentType, previousDocumentId] = previousDocument
    .split(DIFF_SEARCH_PARAM_DELIMITER)
    .filter(Boolean)

  const [nextDocumentType, nextDocumentId] = nextDocument
    .split(DIFF_SEARCH_PARAM_DELIMITER)
    .filter(Boolean)

  if (!isDiffViewMode(mode)) {
    errors.push(['invalidModeParam', mode])
  }

  if (typeof previousDocumentType === 'undefined' || typeof previousDocumentId === 'undefined') {
    errors.push(['invalidPreviousDocumentParam', previousDocument])
  }

  if (typeof nextDocumentType === 'undefined' || typeof nextDocumentId === 'undefined') {
    errors.push(['invalidNextDocumentParam', nextDocument])
  }

  if (errors.length !== 0) {
    return {
      result: 'error',
      errors,
    }
  }

  return {
    result: 'success',
    params: {
      mode,
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
    },
  } as ParamsSuccess
}
