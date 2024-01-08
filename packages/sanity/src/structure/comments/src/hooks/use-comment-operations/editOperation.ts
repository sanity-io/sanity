import {SanityClient} from '@sanity/client'
import {CommentEditPayload} from '../../types'

interface EditOperationProps {
  client: SanityClient
  comment: CommentEditPayload
  id: string
  onEdit?: (id: string, comment: CommentEditPayload) => void
}

export async function editOperation(props: EditOperationProps): Promise<void> {
  const {client, id, comment, onEdit} = props

  const editedComment = {
    message: comment.message,
    lastEditedAt: new Date().toISOString(),
  } satisfies CommentEditPayload

  onEdit?.(id, editedComment)

  await client.patch(id).set(editedComment).commit()
}
