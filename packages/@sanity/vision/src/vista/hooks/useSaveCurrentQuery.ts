import {useToast} from '@sanity/ui/toast'
import {useCallback} from 'react'
import {useTranslation} from 'sanity'

import {visionLocaleNamespace} from '../../i18n'
import {type QueryRequest, type VistaTab} from '../store/types'
import {useSavedQueriesApi} from '../store/VistaActorContext'
import {deriveTabTitle} from '../util/tabTitle'

/**
 * Saves a tab as a personal saved query (stored by its query URL, like the classic tool does),
 * refusing an exact duplicate of that URL, so the same GROQ against another dataset or
 * perspective is a different saved query. Uses the tool-wide saved queries subscription.
 */
export function useSaveCurrentQuery(
  tab: VistaTab,
  request: QueryRequest | null,
): {saveCurrent: () => Promise<void>; canSave: boolean} {
  const {t} = useTranslation(visionLocaleNamespace)
  const toast = useToast()
  const {queries, saveQuery, saving} = useSavedQueriesApi()

  const saveCurrent = useCallback(async () => {
    if (!request) return
    const duplicate = queries.find((query) => !query.shared && query.url === request.url)
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
  }, [queries, request, saveQuery, t, tab, toast])

  return {saveCurrent, canSave: Boolean(request) && !saving}
}
