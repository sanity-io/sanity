import {uuid} from '@sanity/uuid'
import {getPublishedId} from 'sanity'
import {encodeJsonParams, type RouterState, type SearchParam} from 'sanity/router'

import {type PresentationSearchParams, type PresentationStateParams} from './types'

const preservedSearchParamKeys: Array<keyof PresentationSearchParams> = ['preview', 'viewport']

/**
 * @internal
 */
export function getIntentState(
  intent: string,
  params: Record<string, string>,
  routerState: RouterState | undefined,
  payload: unknown,
):
  | (PresentationStateParams & {_searchParams: SearchParam[]})
  | {intent: string; params: Record<string, string>; payload: unknown} {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {id, mode, path, presentation, type, ...searchParams} = params

  const preservedSearchParams = (routerState?._searchParams || [])
    // @todo Casting https://github.com/microsoft/TypeScript/issues/14520
    .filter(([key]) => preservedSearchParamKeys.includes(key as keyof PresentationSearchParams))
    .reduce((acc, [key, value]) => ({...acc, [key]: value}), {} as Record<string, string>)

  const _searchParams = {
    ...preservedSearchParams,
    ...searchParams,
  }

  if (intent === 'edit' && id) {
    _searchParams.preview =
      _searchParams.preview || new URLSearchParams(window.location.search).get('preview') || '/'
    return {
      type: type || '*',
      id: getPublishedId(id),
      path,
      _searchParams: Object.entries(_searchParams),
    }
  }

  if (intent === 'create') {
    _searchParams.preview =
      _searchParams.preview || new URLSearchParams(window.location.search).get('preview') || '/'

    if (payload && typeof payload === 'object') {
      _searchParams.templateParams = encodeJsonParams(payload as Record<string, unknown>)
    }

    return {
      type: type || '*',
      id: id || uuid(),
      _searchParams: Object.entries(_searchParams),
    }
  }
  return {intent, params, payload}
}
