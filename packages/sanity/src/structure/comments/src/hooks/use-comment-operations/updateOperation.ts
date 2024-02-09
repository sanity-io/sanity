import {SanityClient} from '@sanity/client'
import {uuid} from '@sanity/uuid'
import {CommentDocument} from '../../types'

interface UpdateOperationProps {
  client: SanityClient
  id: string
  comment: Partial<CommentDocument>
  onTransactionStart?: (transactionId: string) => void
}

export async function updateOperation(props: UpdateOperationProps): Promise<void> {
  const {client, id, comment, onTransactionStart} = props

  // If the update contains a status, we'll update the status of all replies
  // to the comment as well.
  if (comment.status) {
    await Promise.all([
      client
        .patch({query: `*[_type == "comment" && parentCommentId == "${id}"]`})
        .set({
          status: comment.status,
        })
        .commit(),
      client.patch(id).set(comment).commit(),
    ])

    return
  }

  const transactionId = uuid()
  onTransactionStart?.(transactionId)

  const patch = client?.patch(id).set(comment)

  client.transaction().transactionId(transactionId).patch(patch).commit()
}
