import {useToast} from '@sanity/ui/toast'
import {useCallback, useMemo, useState} from 'react'
import {useTranslation} from 'sanity/i18n'

import {useVisionTelemetry} from '../../__telemetry__/useVisionTelemetry'
import {type QueryConfig} from '../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../i18n'
import {parseQueryUrl} from '../../util/parseQueryUrl'
import {type VisionTab} from '../store/types'
import {
  usePendingEdits,
  useSavedQueriesApi,
  useVisionActor,
  useVisionSelector,
} from '../store/VisionActorContext'
import {selectDatasets} from '../store/visionMachine'
import {findSharedQuery, tabMatchesParsedQuery} from '../util/savedQueryTab'
import {deriveTabTitle} from '../util/tabTitle'
import {type QueryRequestBuilder} from './useQueryRequestBuilder'
import {type ResolvedRequest} from './useResolvedRequest'

export interface ShareTab {
  /** The shared query the tab is shared as, while the current user is its author */
  sharedQuery: QueryConfig | undefined
  /** Whether Share tab applies: the tab is not shared, or it changed since it was shared */
  canShare: boolean
  /** Whether Share tab can run now: the tab builds a request and the shared queries have loaded */
  shareEnabled: boolean
  /**
   * Shares the tab, asking for confirmation first (`confirming`), as the share creates a document.
   * A shared tab is shared again in place, and a tab that is the same query as one already
   * shared is not shared twice.
   */
  share: () => void
  /** Whether the dialog confirming a share is open */
  confirming: boolean
  confirmShare: () => Promise<void>
  cancelShare: () => void
  /** Stops sharing the tab, which stays open */
  unshare: () => Promise<void>
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

/**
 * Shares a tab as a shared query (a `vision.sharedQuery` document, as the classic tool stores
 * them), which everyone using the dataset can open from the Shared tabs drawer. The tab is linked
 * to it (`VisionTab.sharedId`), so the author can share the tab again after changing it, or
 * unshare it. Nothing is written to the personal saved queries.
 *
 * Params typed within the debounce window belong to what is shared: pending edits are committed
 * first and the URL is built from what the machine holds then, not from the last render.
 */
export function useShareTab(
  tab: VisionTab,
  {
    request,
    buildRequest,
    resolved,
  }: Pick<QueryRequestBuilder, 'request' | 'buildRequest'> & {resolved: ResolvedRequest},
): ShareTab {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVisionActor()
  const pendingEdits = usePendingEdits()
  const telemetry = useVisionTelemetry()
  const datasets = useVisionSelector(selectDatasets)
  const {queries, sharedQueriesLoaded, shareQuery, updateSharedQuery, unshareQuery, saving} =
    useSavedQueriesApi()
  const [confirming, setConfirming] = useState(false)

  const sharedQuery = findSharedQuery(tab, queries)
  const sharedUrl = sharedQuery?.url
  const parsedShared = useMemo(
    () => (sharedUrl === undefined ? null : parseQueryUrl(sharedUrl, datasets)),
    [datasets, sharedUrl],
  )
  const untitled = t('label.untitled-query')
  // Titles are compared as the tab and the drawer show them: a query shared without a title of
  // its own was shared with the one derived from it
  const changed =
    sharedQuery !== undefined &&
    (parsedShared === null ||
      !tabMatchesParsedQuery(tab, parsedShared, resolved) ||
      (tab.title || deriveTabTitle(tab.query) || untitled) !==
        (sharedQuery.title || deriveTabTitle(parsedShared.query) || untitled))

  const readCurrent = useCallback(() => {
    pendingEdits.commit()
    const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id) ?? tab
    const current = buildRequest(latest.query, latest.rawParams)
    return current
      ? {
          tab: latest,
          url: current.url,
          title: latest.title || deriveTabTitle(latest.query) || untitled,
        }
      : null
  }, [actorRef, buildRequest, pendingEdits, tab, untitled])

  const reportShareError = useCallback(
    (err: unknown) => {
      toast.push({
        closable: true,
        status: 'error',
        title: t('vision.tabs.share-failed'),
        description: errorMessage(err),
      })
    },
    [t, toast],
  )

  const shareAgain = useCallback(
    async (shared: QueryConfig, {url, title}: {url: string; title: string}) => {
      try {
        await updateSharedQuery({...shared, url, title, savedAt: new Date().toISOString()})
        telemetry.sharedTab('update')
        toast.push({
          closable: true,
          status: 'success',
          title: t('vision.tabs.share-update-success'),
        })
      } catch (err) {
        reportShareError(err)
      }
    },
    [reportShareError, t, telemetry, toast, updateSharedQuery],
  )

  const share = useCallback(() => {
    const current = readCurrent()
    if (!current) return
    if (sharedQuery) {
      void shareAgain(sharedQuery, current)
      return
    }
    // The same request is the same query, whoever shared it and whatever its title
    const duplicate = queries.find((query) => {
      if (!query.shared) return false
      const parsed = parseQueryUrl(query.url, datasets)
      return parsed !== null && tabMatchesParsedQuery(current.tab, parsed, resolved)
    })
    if (duplicate) {
      actorRef.send({type: 'tab.setSharedId', id: tab.id, sharedId: duplicate._key})
      toast.push({
        closable: true,
        status: 'info',
        title: t('vision.tabs.already-shared'),
        description: duplicate.title,
      })
      return
    }
    setConfirming(true)
  }, [
    actorRef,
    datasets,
    queries,
    readCurrent,
    resolved,
    shareAgain,
    sharedQuery,
    t,
    tab.id,
    toast,
  ])

  const confirmShare = useCallback(async () => {
    setConfirming(false)
    const current = readCurrent()
    if (!current) return
    try {
      const sharedId = await shareQuery({
        url: current.url,
        title: current.title,
        savedAt: new Date().toISOString(),
      })
      actorRef.send({type: 'tab.setSharedId', id: tab.id, sharedId})
      telemetry.sharedTab('share')
      toast.push({closable: true, status: 'success', title: t('vision.tabs.share-success')})
    } catch (err) {
      reportShareError(err)
    }
  }, [actorRef, readCurrent, reportShareError, shareQuery, t, tab.id, telemetry, toast])

  const cancelShare = useCallback(() => setConfirming(false), [])

  const unshare = useCallback(async () => {
    if (!sharedQuery) return
    try {
      await unshareQuery(sharedQuery._key)
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('vision.tabs.unshare-failed'),
        description: errorMessage(err),
      })
      return
    }
    actorRef.send({type: 'sharedQuery.unshared', sharedId: sharedQuery._key})
    telemetry.sharedTab('unshare')
    toast.push({closable: true, status: 'success', title: t('vision.tabs.unshare-success')})
  }, [actorRef, sharedQuery, t, telemetry, toast, unshareQuery])

  return {
    sharedQuery,
    canShare: !sharedQuery || changed,
    shareEnabled: Boolean(request) && sharedQueriesLoaded && !saving,
    share,
    confirming,
    confirmShare,
    cancelShare,
    unshare,
  }
}
