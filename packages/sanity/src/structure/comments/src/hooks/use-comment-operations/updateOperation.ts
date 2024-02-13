import {type SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'

import {type CommentUpdatePayload} from '../../types'

interface UpdateOperationProps {
  client: SanityClient
  comment: CommentUpdatePayload
  id: string
  onUpdate?: (id: string, comment: CommentUpdatePayload) => void
  transactionId: string | undefined
}

export async function updateOperation(props: UpdateOperationProps): Promise<void> {
  const {client, id, comment, onUpdate, transactionId: transactionIdProp} = props

  const hasEditedMessage = 'message' in comment

  // If the comment message has been edited, we'll update the lastEditedAt field
  // to reflect the time of the edit.
  const nextComment: CommentUpdatePayload = {
    ...comment,
    lastEditedAt: hasEditedMessage ? new Date().toISOString() : comment?.lastEditedAt,
  }

  onUpdate?.(id, nextComment)

  // Fall back to generating a new transaction id if none is provided
  const transactionId = transactionIdProp || uuid()

  const patch = client?.patch(id).set(nextComment)
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
