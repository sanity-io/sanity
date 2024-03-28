import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'

import {
  type CommentDocument,
  type CommentReactionItem,
  type CommentReactionOption,
  type CommentReactionShortNames,
  type CommentUpdatePayload,
} from '../../types'

// We construct the reaction key by combining the user id and the short name of the reaction.
// This reduces the risk of having duplicate reactions for the same user.
// Although this should not happen, the current implementation of the comment system using
// optimistic updates could cause this to happen in an edge case.
function createReactionKey(userId: string, shortName: CommentReactionShortNames) {
  return `${userId}-${shortName}`
}

interface ReactOperationProps {
  client: SanityClient
  currentUser: CurrentUser
  id: string
  reaction: CommentReactionOption
  getComment?: (id: string) => CommentDocument | undefined
  onUpdate?: (id: string, comment: CommentUpdatePayload) => void
}

export async function reactOperation(props: ReactOperationProps): Promise<void> {
  const {client, currentUser, id, reaction, getComment, onUpdate} = props

  const reactions = getComment?.(id)?.reactions || []
  const currentUserReactions = reactions.filter((r) => r.userId === currentUser.id)

  const _key = createReactionKey(currentUser.id, reaction.shortName)

  const currentReaction = currentUserReactions.find(
    (r) => r._key === _key && r._optimisticState !== 'removed',
  )

  if (currentReaction) {
    // The next optimistic reactions.
    // Comments with the `_optimisticState` set to removed will be filtered out
    // when rendering the list of reactions but kept in the list of reactions
    // to make sure the reaction don't reappears when a real time update is received.
    const next = reactions.map((r) => {
      if (r._key === currentReaction._key) {
        return {...r, _optimisticState: 'removed' as const}
      }

      return r
    })

    // Pass the updated reactions to the onUpdate callback to instantly update the UI.
    onUpdate?.(id, {reactions: next})

    // Unset the reaction
    await client
      .patch(id)
      .unset([`reactions[_key=="${_key}"]`])
      .commit()

    return
  }

  if (!currentReaction) {
    // The new reaction item to add to the comment
    const reactionItem: CommentReactionItem = {
      _key,
      addedAt: new Date().toISOString(),
      shortName: reaction.shortName,
      userId: currentUser.id,
    }

    const optimisticReactionItem: CommentReactionItem = {...reactionItem, _optimisticState: 'added'}

    // The next optimistic reactions
    const next = reactions
      .concat(optimisticReactionItem)
      .filter((r) => !(r._key === reactionItem._key && r._optimisticState === 'removed'))

    // Pass the updated reactions to the onUpdate callback to instantly update the UI.
    onUpdate?.(id, {reactions: next})

    // Append the new reaction to the comment
    await client
      .patch(id)
      .setIfMissing({reactions: []})
      .append('reactions', [reactionItem])
      .commit()
  }
}
