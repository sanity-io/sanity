import {useToast} from '@sanity/ui'
import React, {memo, useEffect, useRef} from 'react'
import {useDocumentId, useDocumentType} from 'sanity/document'
import {usePaneRouter} from '../../components'
import {useDocumentOperationEvent} from 'sanity'

function getOpErrorTitle(op: string): string {
  if (op === 'delete') {
    return `An error occurred while attempting to delete this document.
      This usually means that there are other documents that refers to it.`
  }
  if (op === 'unpublish') {
    return `An error occurred while attempting to unpublish this document.
      This usually means that there are other documents that refers to it.`
  }
  return `An error occurred during ${op}`
}

function getOpSuccessTitle(op: string): string {
  if (op === 'publish') {
    return `The document was published`
  }
  if (op === 'unpublish') {
    return `The document was unpublished. A draft has been created from the latest published version.`
  }
  if (op === 'discardChanges') {
    return `All changes since last publish has now been discarded. The discarded draft can still be recovered from history`
  }
  if (op === 'delete') {
    return `The document was successfully deleted`
  }
  return `Successfully performed ${op} on document`
}

const IGNORE_OPS = ['patch', 'commit']

export const DocumentOperationResults = memo(function DocumentOperationResults() {
  const {push: pushToast} = useToast()
  const documentId = useDocumentId()
  const documentType = useDocumentType()
  const event: any = useDocumentOperationEvent(documentId, documentType)
  const prevEvent = useRef(event)
  const paneRouter = usePaneRouter()

  useEffect(() => {
    if (!event || event === prevEvent.current) return

    let cleanupId: number | undefined

    if (event.type === 'error') {
      pushToast({
        closable: true,
        duration: 30000, // 30s
        status: 'error',
        title: getOpErrorTitle(event.op),
        description: (
          <details>
            <summary>Details</summary>
            {event.error.message}
          </details>
        ),
      })
    }

    if (event.type === 'success' && !IGNORE_OPS.includes(event.op)) {
      pushToast({
        closable: true,
        status: 'success',
        title: getOpSuccessTitle(event.op),
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
  }, [event, paneRouter, pushToast])

  return null
})
