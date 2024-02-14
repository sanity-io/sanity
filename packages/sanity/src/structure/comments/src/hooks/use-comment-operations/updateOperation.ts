import {type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {throttle} from 'lodash'

import {type CommentUpdatePayload} from '../../types'

const THROTTLE_TIME_MS = 1000

interface UpdateOperationProps {
  client: SanityClient
  comment: CommentUpdatePayload
  throttle: boolean | undefined
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

const throttlePostCommentUpdate = throttle(postCommentUpdate, THROTTLE_TIME_MS, {
  trailing: true,
  leading: false,
})

export async function updateOperation(props: UpdateOperationProps): Promise<void> {
  const {id, comment, onUpdate, throttle: throttleProp} = props

  const hasEditedMessage = 'message' in comment

  const editedComment: CommentUpdatePayload = {
    ...comment,
    lastEditedAt: new Date().toISOString(),
  }

  // If the comment message has been edited, we'll update the lastEditedAt field
  // to reflect the time of the edit.
  const nextComment: CommentUpdatePayload = hasEditedMessage ? editedComment : comment

  onUpdate?.(id, nextComment)

  if (!throttleProp) {
    await postCommentUpdate({
      ...props,
      comment: nextComment,
    })
    return
  }

  await throttlePostCommentUpdate({
    ...props,
    comment: nextComment,
  })
}
