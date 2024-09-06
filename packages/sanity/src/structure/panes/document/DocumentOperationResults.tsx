import {useToast} from '@sanity/ui'
import {memo, useEffect, useMemo, useRef} from 'react'
import {Translate, useDocumentOperationEvent, useTranslation} from 'sanity'

import {usePaneRouter} from '../../components'
import {structureLocaleNamespace} from '../../i18n'
import {useDocumentPane} from './useDocumentPane'
import {useDocumentTitle} from './useDocumentTitle'

const IGNORE_OPS = ['patch', 'commit']

export const DocumentOperationResults = memo(function DocumentOperationResults() {
  const {push: pushToast} = useToast()
  const {documentId, documentType, value: documentPaneValue} = useDocumentPane()
  const documentTitleInfo = useDocumentTitle()
  const titleError = documentTitleInfo.error
  const event: any = useDocumentOperationEvent(documentId, documentType)
  const prevEvent = useRef(event)
  const paneRouter = usePaneRouter()
  const {t} = useTranslation(structureLocaleNamespace)

  const title = useMemo(() => {
    // If title isn't set from document preview, use the title from the document pane value
    if (
      !documentTitleInfo.title &&
      !titleError &&
      !IGNORE_OPS.includes(event?.op) &&
      typeof documentPaneValue.title === 'string' &&
      event?.type === 'success'
    ) {
      return documentPaneValue.title
    }
    return documentTitleInfo.title
  }, [documentTitleInfo.title, titleError, event, documentPaneValue.title])
  //Truncate the document title and add "..." if it is over 25 characters
  const documentTitleBase = title || t('panes.document-operation-results.operation-undefined-title')
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
              op: event.op,
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
