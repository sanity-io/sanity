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
 * selection from `range` + `fieldValue` (or clears it when `range` is null).
 */
export async function updateRangeOperation({
  client,
  id,
  onUpdate,
  transactionId,
  optimisticUpdate,
  ...selection
}: UpdateRangeOperationProps): Promise<void> {
  onUpdate?.(id, optimisticUpdate)

  await client.collaboration.comments.update(
    id,
    selection.range === null
      ? // oxlint-disable-next-line no-deprecated -- comments-v2 still uses the deprecated range API from @sanity/client 8.8
        {range: null}
      : // oxlint-disable-next-line no-deprecated -- comments-v2 still uses the deprecated range API from @sanity/client 8.8
        {range: selection.range, fieldValue: selection.fieldValue},
    {transactionId},
  )
}
