import {type SanityClient} from '@sanity/client'

import {type CommentUpdatePayload, type CommentUpdateRangePayload} from '../../types'

type UpdateRangeOperationProps = {
  client: SanityClient
  id: string
  onUpdate?: (id: string, comment: CommentUpdatePayload) => void
  transactionId: string
} & CommentUpdateRangePayload

/**
 * Re-anchors an inline comment after its text has moved. Applies
 * `optimisticUpdate` to the local comment; the API resolves the stored
 * selection from `anchor` (or clears it when `anchor` is null).
 */
export async function updateRangeOperation({
  client,
  id,
  onUpdate,
  transactionId,
  optimisticUpdate,
  anchor,
}: UpdateRangeOperationProps): Promise<void> {
  onUpdate?.(id, optimisticUpdate)

  await client.collaboration.comments.update(id, {anchor}, {transactionId})
}
