import {useToast} from '@sanity/ui'
import React, {memo, useEffect, useRef} from 'react'
import {structureLocaleNamespace} from '../../i18n'
import {usePaneRouter} from '../../components'
import {useDocumentPane} from './useDocumentPane'
import {Translate, useDocumentOperationEvent, useTranslation} from 'sanity'

const IGNORE_OPS = ['patch', 'commit']

export const DocumentOperationResults = memo(function DocumentOperationResults() {
  const {push: pushToast} = useToast()
  const {documentId, documentType, displayed} = useDocumentPane()
  const event: any = useDocumentOperationEvent(documentId, documentType)
  const prevEvent = useRef(event)
  const paneRouter = usePaneRouter()
  const {t} = useTranslation(structureLocaleNamespace)

  //Truncate the document title and add "..." if it is over 25 characters
  const documentTitleBase =
    (displayed?.title as string) || t('panes.document-operation-results.operation-undefined-title')
  const documentTitle =
    documentTitleBase.length > 25 ? `${documentTitleBase.slice(0, 25)}...` : documentTitleBase

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
        title: (
          <Translate
            context={event.op}
            i18nKey="panes.document-operation-results.operation-success"
            t={t}
            values={{
              title: documentTitle,
            }}
            components={{
              Strong: 'strong',
            }}
          />
        ),
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
  }, [event, paneRouter, pushToast, t, documentTitle])

  return null
})
