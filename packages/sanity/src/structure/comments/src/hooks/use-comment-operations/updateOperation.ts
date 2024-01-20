import {type SanityClient} from '@sanity/client'

import {type CommentCreatePayload} from '../../types'

interface UpdateOperationProps {
  client: SanityClient
  id: string
  comment: Partial<CommentCreatePayload>
  onUpdate?: (id: string, comment: Partial<CommentCreatePayload>) => void
}

export async function updateOperation(props: UpdateOperationProps): Promise<void> {
  const {client, id, comment, onUpdate} = props
  onUpdate?.(id, comment)

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

  // Else we'll just update the comment itself
  await client?.patch(id).set(comment).commit()
}
