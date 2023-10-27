import {useToast} from '@sanity/ui'
import React, {memo, useEffect, useRef} from 'react'
import {useDocumentPane} from './useDocumentPane'
import {useDocumentOperationEvent, useTranslation} from 'sanity'
import {usePaneRouter} from '../../components'
import {deskLocaleNamespace} from '../../i18n'

function getOpErrorTitle(op: string): string {
  if (op === 'delete') {
    return 'panes.document-operation-results.delete-operation.error'
  }
  if (op === 'unpublish') {
    return 'panes.document-operation-results.unpublish-operation.error'
  }
  return 'panes.document-operation-results.generic-operation.error'
}

function getOpSuccessTitle(op: string): string {
  if (op === 'publish') {
    return 'panes.document-operation-results.publish-operation.success'
  }
  if (op === 'unpublish') {
    return 'panes.document-operation-results.unpublish-operation.success'
  }
  if (op === 'discardChanges') {
    return 'panes.document-operation-results.discard-changes-operation.success'
  }
  if (op === 'delete') {
    return 'panes.document-operation-results.delete-operation.success'
  }
  return 'panes.document-operation-results.generic-operation.success'
}

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
        title: t(getOpErrorTitle(event.op), {op: event.op}),
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
        title: t(getOpSuccessTitle(event.op), {op: event.op}),
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
