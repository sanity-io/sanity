/* eslint-disable @typescript-eslint/no-shadow */
import {type MutableRefObject, useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react'
import {getPublishedId} from 'sanity'
import {type RouterContextValue, type RouterState, type SearchParam} from 'sanity/router'

import {
  type CombinedSearchParams,
  type FrameState,
  type PresentationNavigate,
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type PresentationStateParams,
  type StructureDocumentPaneParams,
} from './types'
import {parseRouterState} from './util/parse'

function pruneObject<T extends RouterState | PresentationParamsContextValue>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== '' && value !== null,
    ),
  ) as T
}

/**
 * Ensures the array contains all members of the union T.
 */
const exhaustiveTupleOf =
  <T>() =>
  <U extends T[]>(array: U & ([T] extends [U[number]] ? unknown : 'Invalid') & {0: T}) =>
    array

const maintainOnDocumentChange = exhaustiveTupleOf<keyof PresentationSearchParams>()([
  'perspective',
  'preview',
  'viewport',
])

const maintainOnSameDocument = exhaustiveTupleOf<keyof StructureDocumentPaneParams>()([
  'changesInspectorTab',
  'comment',
  'inspect',
  'instruction',
  'scheduledDraft',
  'parentRefPath',
  'path',
  'pathKey',
  'rev',
  'since',
  'template',
  'templateParams',
  'version',
  'view',
])

export function useParams({
  initialPreviewUrl,
  routerNavigate,
  routerState,
  routerSearchParams,
  frameStateRef,
}: {
  initialPreviewUrl: URL
  routerNavigate: RouterContextValue['navigate']
  routerState: RouterState & PresentationStateParams
  routerSearchParams: {
    [k: string]: string
  }
  frameStateRef: MutableRefObject<FrameState>
}): {
  isSameDocument: (state: PresentationStateParams) => boolean
  navigate: PresentationNavigate
  navigationHistory: RouterState[]
  params: PresentationParamsContextValue
  searchParams: PresentationSearchParams
  structureParams: StructureDocumentPaneParams
} {
  const params = useMemo<PresentationParamsContextValue>(() => {
    const {id, path, type} = parseRouterState(routerState)

    return {
      id,
      type,
      path,
      preview: routerSearchParams.preview || initialPreviewUrl.toString(),
      perspective: routerSearchParams.perspective,
      viewport: routerSearchParams.viewport,
      inspect: routerSearchParams.inspect,
      scheduledDraft: routerSearchParams.scheduledDraft,

      parentRefPath: routerSearchParams.parentRefPath,
      rev: routerSearchParams.rev,
      since: routerSearchParams.since,
      template: routerSearchParams.template,
      templateParams: routerSearchParams.templateParams,
      view: routerSearchParams.view,
      // assist
      pathKey: routerSearchParams.pathKey,
      instruction: routerSearchParams.instruction,
      // comments
      comment: routerSearchParams.comment,
      changesInspectorTab: routerSearchParams.changesInspectorTab as 'history' | 'review',
    }
  }, [routerState, routerSearchParams, initialPreviewUrl])

  const structureParams = useMemo<StructureDocumentPaneParams>(() => {
    const pruned = pruneObject({
      inspect: params.inspect,
      scheduledDraft: params.scheduledDraft,
      path: params.path,
      parentRefPath: params.parentRefPath,
      rev: params.rev,
      since: params.since,
      template: params.template,
      templateParams: params.templateParams,
      view: params.view,
      // assist
      pathKey: params.pathKey,
      instruction: params.instruction,
      // comments
      comment: params.comment,
      changesInspectorTab: params.changesInspectorTab,
    })
    return pruned
  }, [
    params.changesInspectorTab,
    params.comment,
    params.inspect,
    params.instruction,
    params.path,
    params.pathKey,
    params.parentRefPath,
    params.rev,
    params.since,
    params.template,
    params.templateParams,
    params.view,
    params.scheduledDraft,
  ])

  const searchParams = useMemo<PresentationSearchParams>(() => {
    const pruned = pruneObject({
      perspective: params.perspective,
      preview: params.preview,
      viewport: params.viewport,
    })
    return pruned
  }, [params.perspective, params.preview, params.viewport])

  const routerStateRef = useRef(routerState)

  useLayoutEffect(() => {
    routerStateRef.current = routerState
  }, [routerState])

  const [navigationHistory, setNavigationHistory] = useState<RouterState[]>([routerState])

  // Helper function to check if a given document is the same as the one in the
  // current router state
  const isSameDocument = useCallback(({id, type}: PresentationStateParams) => {
    const {current} = routerStateRef
    return id === current.id && type === current.type
  }, [])

  const navigate = useCallback<PresentationNavigate>(
    (options) => {
      const {state, params, replace = false} = options

      // Force navigation to use published IDs only
      if (state?.id) state.id = getPublishedId(state.id)

      // Get the current state and params
      const {current} = routerStateRef
      const currentState = {
        id: current.id,
        type: current.type,
        path: current.path,
      } satisfies PresentationStateParams
      const currentParams = Object.fromEntries(current._searchParams || []) as CombinedSearchParams

      // If state is provided, replace the current state with the provided
      // state, otherwise maintain the current state
      const nextState = state || currentState

      // Different params need to be maintained under different conditions
      const maintainedParamKeys = [
        ...maintainOnDocumentChange,
        ...(isSameDocument(nextState) ? maintainOnSameDocument : []),
      ] satisfies (keyof CombinedSearchParams)[]

      const maintainedParams = maintainedParamKeys.reduce((acc, key) => {
        // @ts-expect-error changesInspectorTab union type doesn't play nicely
        // here, if it were just a string it would be fine
        acc[key] = currentParams[key]
        return acc
      }, {} as Partial<CombinedSearchParams>)

      // If params are provided, merge them with the maintained params
      const nextParams = {...maintainedParams, ...params}

      const nextRouterState = {
        ...nextState,
        _searchParams: Object.entries(nextParams).reduce(
          (acc, [key, value]) => [...acc, [key, value] as SearchParam],
          [] as SearchParam[],
        ),
      } satisfies RouterState

      setNavigationHistory((prev) => [...prev, nextRouterState])
      routerNavigate(nextRouterState, {replace})
    },
    [isSameDocument, routerNavigate],
  )

  return {
    isSameDocument,
    navigate,
    navigationHistory,
    params,
    searchParams,
    structureParams,
  }
}
