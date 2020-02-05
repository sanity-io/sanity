import * as React from 'react'
import Snackbar from 'part:@sanity/components/snackbar/default'
import {useDocumentOperationEvent} from '@sanity/react-hooks'

function getOpErrorTitle(op) {
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

function getOpSuccessTitle(op) {
  if (op === 'publish') {
    return `This document is now published. If you continue editing a draft will be created.`
  }
  if (op === 'unpublish') {
    return `This document is now unpublished. We have created a draft from the latest published version.`
  }
  if (op === 'discardChanges') {
    return `All changes since last publish has been discarded. You can still recover the previous draft from history`
  }
  if (op === 'delete') {
    return `This document is now deleted. If you continue editing it will be recreated. You can also still recover the deleted version from history.`
  }
  return `Successfully performed ${op} on document`
}

const IGNORE_OPS = ['patch', 'commit']

export function DocumentOperationResults(props: {id: string; type: string}) {
  const event: any = useDocumentOperationEvent(props.id, props.type)

  if (!event) {
    return null
  }

  if (event && event.type === 'error') {
    return (
      <Snackbar
        kind="error"
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
    return <Snackbar kind="success" title={getOpSuccessTitle(event.op)} />
  }

  return null
}
