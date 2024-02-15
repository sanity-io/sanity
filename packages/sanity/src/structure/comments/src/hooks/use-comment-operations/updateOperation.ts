import {type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {throttle, type ThrottleSettings} from 'lodash'

import {type CommentUpdatePayload} from '../../types'

interface UpdateOperationProps {
  client: SanityClient
  comment: CommentUpdatePayload
  throttled: boolean | undefined
  id: string
  onUpdate?: (id: string, comment: CommentUpdatePayload) => void
  transactionId: string | undefined
}

async function postCommentUpdate(props: UpdateOperationProps) {
  const {client, id, comment, transactionId: transactionIdProp} = props

  // Fall back to generating a new transaction id if none is provided
  const transactionId = transactionIdProp || uuid()
  const patch = client?.patch(id).set(comment)
  const transaction = client.transaction().transactionId(transactionId).patch(patch)

  // If the update contains a status, we'll update the status of all replies
  // to the comment as well.
  if (comment.status) {
    await transaction.commit()

    await client
      .patch({query: `*[_type == "comment" && parentCommentId == "${id}"]`})
      .set({
        status: comment.status,
      })
      .commit()

    return
  }

  // Else we'll just update the comment itself
  await transaction.commit()
}

const THROTTLE_TIME_MS = 1000

const THROTTLE_SETTINGS: ThrottleSettings = {
  trailing: true,
  leading: false,
}

const throttleFunctionsMap = new Map()

/*
 * Retrieves or creates a unique throttled function for each comment based on its ID.
 * This is necessary because using a single throttled function for all updates would
 * mean subsequent calls within the throttle period could be ignored, which isn't ideal
 * when updates are not uniform across all operations. By creating a unique throttled
 * function for each ID, we ensure each comment update operation is individually throttled,
 * allowing for controlled execution while preventing rapid, consecutive calls from
 * bypassing the intended throttle behavior.
 */
function getThrottledFunction(id: string) {
  if (!throttleFunctionsMap.has(id)) {
    const throttledFunction = throttle(postCommentUpdate, THROTTLE_TIME_MS, THROTTLE_SETTINGS)
    throttleFunctionsMap.set(id, throttledFunction)
    return throttledFunction
  }
  return throttleFunctionsMap.get(id)
}

export async function updateOperation(props: UpdateOperationProps): Promise<void> {
  const {id, comment, onUpdate, throttled: throttledProp} = props

  const hasEditedMessage = 'message' in comment

  const editedComment: CommentUpdatePayload = {
    ...comment,
    lastEditedAt: new Date().toISOString(),
  }

  const nextComment: CommentUpdatePayload = hasEditedMessage ? editedComment : comment

  onUpdate?.(id, nextComment)

  if (!throttledProp) {
    await postCommentUpdate({
      ...props,
      comment: nextComment,
    })
    return
  }

  const throttlePostCommentUpdate = getThrottledFunction(id)
  await throttlePostCommentUpdate({
    ...props,
    comment: nextComment,
  })
}
