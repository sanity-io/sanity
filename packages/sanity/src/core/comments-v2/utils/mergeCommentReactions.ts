import {type CommentReactionItem} from '../types'

/**
 * A function to merge two arrays of comment reactions.
 */
export function mergeCommentReactions(
  reactionsA: CommentReactionItem[],
  reactionsB: CommentReactionItem[],
): CommentReactionItem[] {
  const mergedReactions: Record<string, CommentReactionItem> = {}

  // Merge reactionsA into the result
  for (const reaction of reactionsA) {
    mergedReactions[reaction._key] = {...reaction}
  }

  // Merge reactionsB into the result, overriding or adding new reactions
  for (const reaction of reactionsB) {
    mergedReactions[reaction._key] = {...mergedReactions[reaction._key], ...reaction}
  }

  // Convert the mergedReactions object back to an array
  const result = Object.values(mergedReactions)

  return result
}
