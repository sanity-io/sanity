import isEqual from 'lodash-es/isEqual.js'
import {useEffect, useMemo, useRef} from 'react'
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
  onActiveChanged,
  onTargetDocumentsChanged,
}: {
  onParamsError?: (errors: DiffViewStateErrorWithInput[]) => void
  onActiveChanged?: (previousState: DiffViewState | undefined, state: DiffViewState) => void
  onTargetDocumentsChanged?: (
    previousState: DiffViewState | undefined,
    state: DiffViewState,
  ) => void
} = {}): DiffViewState {
  const {state: routerState} = useRouter()
  const searchParams = new URLSearchParams(routerState._searchParams)
  const previousDocument = searchParams.get(DIFF_VIEW_PREVIOUS_DOCUMENT_SEARCH_PARAMETER)
  const nextDocument = searchParams.get(DIFF_VIEW_NEXT_DOCUMENT_SEARCH_PARAMETER)
  const mode = searchParams.get(DIFF_VIEW_SEARCH_PARAMETER)
  const anyParamSet = [previousDocument, nextDocument, mode].some((param) => param !== null)
  const previousState = useRef<DiffViewState | undefined>(undefined)

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

  const state = useMemo<DiffViewState>(() => {
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
  }, [params])

  useEffect(() => {
    if (
      typeof onActiveChanged === 'function' &&
      previousState.current?.isActive !== state.isActive
    ) {
      onActiveChanged(previousState.current, state)
    }
  }, [onActiveChanged, state])

  useEffect(() => {
    if (
      typeof onTargetDocumentsChanged === 'function' &&
      previousState.current?.isActive &&
      state.isActive &&
      !isEqual(
        [
          previousState?.current?.documents?.previous.id,
          previousState?.current?.documents?.next.id,
        ],
        [state.documents?.previous.id, state.documents?.next.id],
      )
    ) {
      onTargetDocumentsChanged(previousState.current, state)
    }
  }, [onTargetDocumentsChanged, state])

  useEffect(() => {
    previousState.current = state
  }, [state])

  return state
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

/**
 * Given the previous and current states, determine whether the view became
 * active (entered) or became inactive (exited).
 *
 * @internal
 */
export function selectActiveTransition(
  previousState: Pick<DiffViewState, 'isActive'> | undefined,
  state: Pick<DiffViewState, 'isActive'>,
): 'entered' | 'exited' | undefined {
  if (!previousState?.isActive && state.isActive) {
    return 'entered'
  }

  if (previousState?.isActive && !state.isActive) {
    return 'exited'
  }

  return undefined
}
