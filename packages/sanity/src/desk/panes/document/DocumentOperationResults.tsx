import {useToast} from '@sanity/ui'
import React, {memo, useEffect, useRef} from 'react'
import {useDocumentPane} from './useDocumentPane'
import {useDocumentOperationEvent, useTranslation} from 'sanity'
import {usePaneRouter} from '../../components'
import {deskLocaleNamespace} from '../../i18n'

const IGNORE_OPS = ['patch', 'commit']

export const DocumentOperationResults = memo(function DocumentOperationResults() {
  const {push: pushToast} = useToast()
  const {documentId, documentType} = useDocumentPane()
  const event: any = useDocumentOperationEvent(documentId, documentType)
  const prevEvent = useRef(event)
  const paneRouter = usePaneRouter()
  const {t} = useTranslation(deskLocaleNamespace)

  useEffect(() => {
    if (!event || event === prevEvent.current) return

    let cleanupId: number | undefined

    if (event.type === 'error') {
      pushToast({
        closable: true,
        duration: 30000, // 30s
        status: 'error',
        title: t('panes.document-operation-results.operation-error', {context: event.op}),
        description: (
          <details>
            <summary>{t('panes.document-operation-results.error.summary.title')}</summary>
            {event.error.message}
          </details>
        ),
      })
    }

    if (event.type === 'success' && !IGNORE_OPS.includes(event.op)) {
      pushToast({
        closable: true,
        status: 'success',
        title: t('panes.document-operation-results.operation-success', {context: event.op}),
      })
    }

    /**
     * If the document was deleted successfully, close the pane.
     */
    if (event.type === 'success' && event.op === 'delete') {
      // Wait until next tick to allow deletion toasts to appear first
      cleanupId = setTimeout(() => paneRouter.closeCurrentAndAfter(), 0) as any as number
    }

    prevEvent.current = event

    // eslint-disable-next-line consistent-return
    return () => clearTimeout(cleanupId)
  }, [event, paneRouter, pushToast, t])

  return null
})
