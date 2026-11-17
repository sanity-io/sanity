import {useToast} from '@sanity/ui/toast'
import {useEffect, useRef} from 'react'
import {useTranslation} from 'sanity'
import {useRouter} from 'sanity/router'
import {useEffectEvent} from 'use-effect-event'

import {visionLocaleNamespace} from '../../i18n'
import {parseQueryUrl} from '../../util/parseQueryUrl'
import {useQueryRequestBuilder} from '../hooks/useQueryRequestBuilder'
import {resolveRequestOptions, useRequestEnvironment} from '../hooks/useResolvedRequest'
import {type VisionTab} from '../store/types'
import {useVisionActor, useVisionSelector} from '../store/VisionActorContext'
import {selectDatasets} from '../store/visionMachine'
import {parsedQueryToTabInit, tabMatchesParsedQuery} from '../util/savedQueryTab'

/** The tool's search param holding the active tab's request, as `vision[url]=…` in the address */
const URL_STATE_PARAM = 'url'
/** Typing changes the request with every key; the address follows once it settles */
const WRITE_DELAY_MS = 500

/**
 * Keeps the active tab's request in the tool's URL, so the address bar can be bookmarked or
 * shared, and opens the request a URL names when it is not what the tool wrote there itself (a
 * link opened from elsewhere, a bookmark). The value is the query URL the Response panel shows,
 * read the way a pasted one is: a tab already showing the request is selected, otherwise one
 * opens for it and runs the query right away, as a pasted URL does. A tab that already shows the
 * request is only selected (after a reload, the address names the active tab's own request), so
 * its last result stays as it was.
 */
export function VisionUrlState({tab}: {tab: VisionTab}) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const router = useRouter()
  const actorRef = useVisionActor()
  const datasets = useVisionSelector(selectDatasets)
  const environment = useRequestEnvironment()
  const {request} = useQueryRequestBuilder(tab)
  const activeUrl = request?.url ?? null
  const linkedUrl = new URLSearchParams(router.state._searchParams ?? []).get(URL_STATE_PARAM)
  // What this component last wrote or read, so its own writes are not read back as a link
  const knownUrlRef = useRef<string | null | undefined>(undefined)

  const openLinkedRequest = useEffectEvent((url: string) => {
    const parsed = parseQueryUrl(url, datasets)
    if (!parsed) return
    const existing = actorRef
      .getSnapshot()
      .context.tabs.find((candidate) =>
        tabMatchesParsedQuery(
          candidate,
          parsed,
          resolveRequestOptions(candidate.options, environment),
        ),
      )
    if (existing) {
      actorRef.send({type: 'tab.select', id: existing.id})
      return
    }
    actorRef.send({type: 'tab.add', tab: parsedQueryToTabInit(parsed), fetch: 'link'})
    if (!parsed.isKnownDataset) {
      toast.push({
        closable: true,
        status: 'warning',
        title: t('vision.saved.unknown-dataset', {dataset: parsed.dataset}),
      })
    }
  })

  useEffect(() => {
    if (!linkedUrl || linkedUrl === knownUrlRef.current) return
    knownUrlRef.current = linkedUrl
    openLinkedRequest(linkedUrl)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [linkedUrl])

  const writeUrl = useEffectEvent((url: string | null) => {
    knownUrlRef.current = url
    if (url === linkedUrl) return
    router.navigate(
      {...router.state, _searchParams: url ? [[URL_STATE_PARAM, url]] : []},
      {replace: true},
    )
  })

  useEffect(() => {
    const timer = setTimeout(() => writeUrl(activeUrl), WRITE_DELAY_MS)
    return () => clearTimeout(timer)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [activeUrl])

  return null
}
