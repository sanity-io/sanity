import {useDocumentOperationEvent} from '@sanity/react-hooks'
import {useToast} from '@sanity/ui'
import React, {useEffect} from 'react'

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
    return `This document was deleted. It can still be recovered from history and if you continue editing it will be recreated.`
  }
  return `Successfully performed ${op} on document`
}

const IGNORE_OPS = ['patch', 'commit']

type Props = {
  id: string
  type: string
}

export const DocumentOperationResults = React.memo((props: Props) => {
  const {push} = useToast()
  const event: any = useDocumentOperationEvent(props.id, props.type)

  useEffect(() => {
    if (!event) return

    if (event.type === 'error') {
      push({
        closable: true,
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
      push({
        closable: true,
        status: 'success',
        title: getOpSuccessTitle(event.op),
      })
    }
  }, [event, push])

  return null
})

DocumentOperationResults.displayName = 'DocumentOperationResults'
