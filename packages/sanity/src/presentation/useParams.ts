/* eslint-disable @typescript-eslint/no-shadow */
import {type MutableRefObject, useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {getPublishedId} from 'sanity'
import {type RouterContextValue, type RouterState, type SearchParam} from 'sanity/router'

import {parseRouterState} from './lib/parse'
import {
  type CombinedSearchParams,
  type FrameState,
  type PresentationNavigate,
  type PresentationParamsContextValue,
  type PresentationSearchParams,
  type PresentationStateParams,
  type StructureDocumentPaneParams,
} from './types'

function pruneObject<T extends RouterState | PresentationParamsContextValue>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([, value]) => value !== undefined && value !== '' && value !== null,
    ),
  ) as T
}

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
      preview:
        routerSearchParams.preview || `${initialPreviewUrl.pathname}${initialPreviewUrl.search}`,
      perspective: routerSearchParams.perspective,
      viewport: routerSearchParams.viewport,
      inspect: routerSearchParams.inspect,
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
      path: params.path,
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
    params.rev,
    params.since,
    params.template,
    params.templateParams,
    params.view,
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

  useEffect(() => {
    routerStateRef.current = routerState
  }, [routerState])

  const [navigationHistory, setNavigationHistory] = useState<RouterState[]>([routerState])

  const navigate = useCallback<PresentationNavigate>(
    (nextState, nextSearchState = {}, forceReplace) => {
      // Force navigation to use published IDs only
      if (nextState.id) nextState.id = getPublishedId(nextState.id)

      // Extract type, id and path as 'routerState'
      const {_searchParams: routerSearchParams, ...routerState} = routerStateRef.current

      // Convert array of search params to an object
      const routerSearchState = (routerSearchParams || []).reduce((acc, [key, value]) => {
        acc[key as keyof CombinedSearchParams] = value as undefined | 'history' | 'review'
        return acc
      }, {} as CombinedSearchParams)

      // Merge routerState and incoming state
      const state: RouterState = pruneObject({
        ...routerState,
        ...nextState,
      })

      // Merge routerSearchState and incoming searchState
      const searchState = pruneObject({
        ...routerSearchState,
        ...nextSearchState,
      })

      // If the document has changed, clear the template and templateParams
      if (routerState.id !== state.id) {
        delete searchState.template
        delete searchState.templateParams
      }

      state._searchParams = Object.entries(searchState).reduce(
        (acc, [key, value]) => [...acc, [key, value] as SearchParam],
        [] as SearchParam[],
      )

      const replace = forceReplace ?? searchState.preview === frameStateRef.current.url

      setNavigationHistory((prev) => [...prev, state])
      routerNavigate(state, {replace})
    },
    [routerNavigate, frameStateRef],
  )

  return {
    navigate,
    navigationHistory,
    params,
    searchParams,
    structureParams,
  }
}
