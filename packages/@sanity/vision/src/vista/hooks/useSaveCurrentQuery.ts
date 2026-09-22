import {useToast} from '@sanity/ui/toast'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'

import {useSavedQueries} from '../../hooks/useSavedQueries'
import {visionLocaleNamespace} from '../../i18n'
import {type QueryRequest, type VistaTab} from '../store/types'
import {tabMatchesSavedQuery} from '../util/savedQueryTab'
import {deriveTabTitle} from '../util/tabTitle'

/**
 * Saves the active tab as a personal saved query (stored by its query URL, like Vision does),
 * refusing duplicates. Also exposes the underlying saved queries API for the list panels.
 */
export function useSaveCurrentQuery(
  tab: VistaTab,
  request: QueryRequest | null,
  datasets: readonly string[],
) {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const savedQueries = useSavedQueries()
  const {queries, saveQuery, saving} = savedQueries

  const saveCurrent = useCallback(async () => {
    if (!request) return
    const duplicate = queries.find(
      (query) => !query.shared && tabMatchesSavedQuery(tab, query, datasets),
    )
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
        url: request.url,
        savedAt: new Date().toISOString(),
        title: tab.title || deriveTabTitle(tab.query) || t('label.untitled-query'),
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
  }, [datasets, queries, request, saveQuery, t, tab, toast])

  return {...savedQueries, saveCurrent, canSave: Boolean(request) && !saving}
}
