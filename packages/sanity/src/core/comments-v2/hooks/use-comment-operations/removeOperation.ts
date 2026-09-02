import {type SanityClient} from '@sanity/client'

interface RemoveOperationProps {
  client: SanityClient
  id: string
  onRemove?: (id: string) => void
}

export async function removeOperation(props: RemoveOperationProps): Promise<void> {
  const {client, id, onRemove} = props
  onRemove?.(id)

  // Comments API cascades deletes to replies automatically
  await client.collaboration.comments.delete(id)
}
