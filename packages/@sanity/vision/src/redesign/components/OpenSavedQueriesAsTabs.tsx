import {useToast} from '@sanity/ui/toast'
import {useEffect, useEffectEvent} from 'react'
import {useTranslation} from 'sanity/i18n'

import {type QueryConfig} from '../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../i18n'
import {parseQueryUrl, type ParsedQueryUrl} from '../../util/parseQueryUrl'
import {resolveRequestOptions, useRequestEnvironment} from '../hooks/useResolvedRequest'
import {type VisionTabInit} from '../store/types'
import {useSavedQueriesApi, useVisionActor, useVisionSelector} from '../store/VisionActorContext'
import {selectDatasets} from '../store/visionMachine'
import {savedQueryToTabInit, tabMatchesParsedQuery} from '../util/savedQueryTab'

/**
 * Opens the personal saved queries as tabs the user can edit, run and close, so the queries saved
 * in the classic tool are there after an upgrade. Each opens once per browser (see
 * `savedQueries.open`): a reload adds nothing, and a closed one stays closed, listed in the
 * Restore tabs drawer like any closed tab. One a tab already shows is recorded without opening
 * another. The list loads from the server after the tool opens, so whatever arrives later opens
 * then. The tabs open newest first, ahead of the open ones, so the tab the tool opened with stays
 * last. Shared queries stay in their own drawer.
 */
export function OpenSavedQueriesAsTabs() {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVisionActor()
  const datasets = useVisionSelector(selectDatasets)
  const environment = useRequestEnvironment()
  const {queries} = useSavedQueriesApi()

  const openSavedQueries = useEffectEvent((saved: QueryConfig[]) => {
    const {tabs, openedSavedQueries} = actorRef.getSnapshot().context
    const isShown = (parsed: ParsedQueryUrl) =>
      tabs.some((tab) =>
        tabMatchesParsedQuery(tab, parsed, resolveRequestOptions(tab.options, environment)),
      )
    const recorded = new Set(openedSavedQueries)
    const openingUrls = new Set<string>()
    const opening: {key: string; tab: VisionTabInit | null}[] = []
    for (const query of saved) {
      if (query.shared || recorded.has(query._key)) continue
      const parsed = parseQueryUrl(query.url, datasets)
      const tab =
        parsed && !openingUrls.has(query.url) && !isShown(parsed)
          ? savedQueryToTabInit(query, parsed)
          : null
      opening.push({key: query._key, tab})
      openingUrls.add(query.url)
    }
    if (opening.length === 0) return

    actorRef.send({type: 'savedQueries.open', queries: opening})
    const count = opening.filter(({tab}) => tab).length
    if (count > 0) {
      toast.push({closable: true, status: 'info', title: t('vision.saved.opened-as-tabs', {count})})
    }
  })

  useEffect(() => {
    openSavedQueries(queries)
  }, [queries])

  return null
}
