import {useDocumentOperationEvent} from '@sanity/react-hooks'
import Snackbar from 'part:@sanity/components/snackbar/default'
import React from 'react'

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
    return `This document is now published.`
  }
  if (op === 'unpublish') {
    return `This document is now unpublished. A draft have been created from the latest published version.`
  }
  if (op === 'discardChanges') {
    return `All changes since last publish has now been discarded. The discarded draft can still be recovered from history`
  }
  if (op === 'delete') {
    return `This document is now deleted. It can still be recovered from history and if you continue editing it will be recreated.`
  }
  return `Successfully performed ${op} on document`
}

const IGNORE_OPS = ['patch', 'commit']

type Props = {
  id: string
  type: string
}

export const DocumentOperationResults = React.memo((props: Props) => {
  const event: any = useDocumentOperationEvent(props.id, props.type)

  if (!event) {
    return null
  }

  if (event && event.type === 'error') {
    return (
      <Snackbar
        kind="error"
        key={Math.random()}
        title={getOpErrorTitle(event.op)}
        subtitle={
          <details>
            <summary>Details</summary>
            {event.error.message}
          </details>
        }
      />
    )
  }

  if (event && event.type === 'success' && !IGNORE_OPS.includes(event.op)) {
    return <Snackbar key={Math.random()} kind="success" title={getOpSuccessTitle(event.op)} />
  }

  return null
})

DocumentOperationResults.displayName = 'DocumentOperationResults'
