import {useCallback, useMemo} from 'react'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../i18n'
import {encodeQueryString} from '../../util/encodeQueryString'
import {type Params, parseParams} from '../../util/parseParams'
import {type QueryRequest, type VisionTab} from '../store/types'
import {useVisionSelector} from '../store/VisionActorContext'
import {selectSourceMapRequest} from '../store/visionMachine'
import {type ResolvedRequest, useResolvedRequest} from './useResolvedRequest'

export interface QueryRequestBuilder {
  resolved: ResolvedRequest
  params: Params
  /** `null` while the query is empty, the params are invalid or the API version is unusable */
  request: QueryRequest | null
  /**
   * The request for other query text or params under the tab's current options, for callers
   * that hold values newer than the rendered tab (a debounced params edit being flushed)
   */
  buildRequest: (query: string, rawParams: string) => QueryRequest | null
}

/** Turns a tab's query, params and options into the request the query runner executes */
export function useQueryRequestBuilder(tab: VisionTab): QueryRequestBuilder {
  const {t} = useTranslation(visionLocaleNamespace)
  const resolved = useResolvedRequest(tab.options)
  const sourceMapPreference = useVisionSelector(selectSourceMapRequest)
  const resultSourceMap = tab.options.includeSourceMap ? sourceMapPreference : undefined
  const {client, perspective, variant, isValidApiVersion, useCdn} = resolved

  const buildRequest = useCallback(
    (query: string, rawParams: string): QueryRequest | null => {
      const params = parseParams(rawParams, t)
      if (!params.valid || !isValidApiVersion || !query.trim()) {
        return null
      }
      const urlOptions: Record<string, string | string[]> = {
        ...(perspective !== undefined ? {perspective} : {}),
        ...(variant ? {variant} : {}),
        ...(resultSourceMap === undefined ? {} : {resultSourceMap: String(resultSourceMap)}),
      }
      const url = client.getUrl(
        client.getDataUrl('query', encodeQueryString(query, params.parsed, urlOptions)),
        useCdn,
      )
      return {client, query, params: params.parsed || {}, resultSourceMap, useCdn, url}
    },
    [client, isValidApiVersion, perspective, resultSourceMap, t, useCdn, variant],
  )

  const params = useMemo(() => parseParams(tab.rawParams, t), [tab.rawParams, t])
  const request = useMemo(
    () => buildRequest(tab.query, tab.rawParams),
    [buildRequest, tab.query, tab.rawParams],
  )

  return {resolved, params, request, buildRequest}
}
