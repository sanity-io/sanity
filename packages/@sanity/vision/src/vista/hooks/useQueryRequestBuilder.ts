import {useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity'

import {parseParams} from '../../components/ParamsEditor'
import {type Params} from '../../components/VisionGui'
import {visionLocaleNamespace} from '../../i18n'
import {encodeQueryString} from '../../util/encodeQueryString'
import {type QueryRequest, type VistaTab} from '../store/types'
import {type ResolvedRequest, useResolvedRequest} from './useResolvedRequest'

export interface QueryRequestBuilder {
  resolved: ResolvedRequest
  params: Params
  /** `null` while the query is empty, the params are invalid or the API version is unusable */
  request: QueryRequest | null
  /** Same as `request`, but for params the tab has not picked up yet */
  buildRequest: (rawParams: string) => QueryRequest | null
}

/** Turns a tab's query, params and options into the request the query runner executes */
export function useQueryRequestBuilder(tab: VistaTab): QueryRequestBuilder {
  const {t} = useTranslation(visionLocaleNamespace)
  const resolved = useResolvedRequest(tab.options)
  const params = useMemo(() => parseParams(tab.rawParams, t), [tab.rawParams, t])
  const {query} = tab
  const {includeSourceMap} = tab.options
  const {client, perspective, variant, isValidApiVersion} = resolved

  const buildRequest = useCallback(
    (rawParams: string): QueryRequest | null => {
      const {valid, parsed} = parseParams(rawParams, t)
      if (!valid || !isValidApiVersion || !query.trim()) {
        return null
      }
      const urlOptions: Record<string, string | string[]> = {
        ...(perspective !== undefined ? {perspective} : {}),
        ...(variant ? {variant} : {}),
        ...(includeSourceMap ? {resultSourceMap: 'true'} : {}),
      }
      const url = client.getUrl(
        client.getDataUrl('query', encodeQueryString(query, parsed, urlOptions)),
      )
      return {client, query, params: parsed || {}, includeSourceMap, url}
    },
    [client, includeSourceMap, isValidApiVersion, perspective, query, t, variant],
  )

  const request = useMemo(() => buildRequest(tab.rawParams), [buildRequest, tab.rawParams])

  return {resolved, params, request, buildRequest}
}
