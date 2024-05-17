import {type SanityClient} from '@sanity/client'

interface RemoveOperationProps {
  client: SanityClient
  id: string
  onRemove?: (id: string) => void
}

export async function removeOperation(props: RemoveOperationProps): Promise<void> {
  const {client, id, onRemove} = props
  onRemove?.(id)

  await Promise.all([
    client.delete({query: `*[_type == "comment" && parentCommentId == "${id}"]`}),
    client.delete(id),
  ])
}
