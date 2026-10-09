import {useToast} from '@sanity/ui/toast'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../i18n'
import {type VistaTab} from '../store/types'
import {usePendingEdits, useSavedQueriesApi, useVistaActor} from '../store/VistaActorContext'
import {deriveTabTitle} from '../util/tabTitle'
import {type QueryRequestBuilder} from './useQueryRequestBuilder'

/**
 * Saves a tab as a personal saved query (stored by its query URL, like the classic tool does),
 * refusing an exact duplicate of that URL, so the same GROQ against another dataset or
 * perspective is a different saved query. Uses the tool-wide saved queries subscription.
 *
 * Params typed within the debounce window belong to what is saved: pending edits are committed
 * first and the URL is built from what the machine holds then, not from the last render.
 */
export function useSaveCurrentQuery(
  tab: VistaTab,
  {request, buildRequest}: Pick<QueryRequestBuilder, 'request' | 'buildRequest'>,
): {saveCurrent: () => Promise<void>; canSave: boolean} {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const actorRef = useVistaActor()
  const pendingEdits = usePendingEdits()
  const {queries, saveQuery, saving} = useSavedQueriesApi()

  const saveCurrent = useCallback(async () => {
    pendingEdits.commit()
    const latest = actorRef.getSnapshot().context.tabs.find((it) => it.id === tab.id) ?? tab
    const current = buildRequest(latest.query, latest.rawParams)
    if (!current) return
    const duplicate = queries.find((query) => !query.shared && query.url === current.url)
    if (duplicate) {
      toast.push({
        closable: true,
        status: 'warning',
        title: t('save-query.already-saved'),
        description: duplicate.title,
      })
      return
    }
    try {
      await saveQuery({
        shared: false,
        url: current.url,
        savedAt: new Date().toISOString(),
        title: latest.title || deriveTabTitle(latest.query) || t('label.untitled-query'),
      })
      toast.push({closable: true, status: 'success', title: t('save-query.success')})
    } catch (err) {
      toast.push({
        closable: true,
        status: 'error',
        title: t('save-query.error'),
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }, [actorRef, buildRequest, pendingEdits, queries, saveQuery, t, tab, toast])

  return {saveCurrent, canSave: Boolean(request) && !saving}
}
