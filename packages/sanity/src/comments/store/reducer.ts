import {type CommentDocument, type CommentPostPayload} from '../types'
import {mergeCommentReactions} from '../utils'

interface CommentAddedAction {
  payload: CommentDocument | CommentPostPayload
  type: 'COMMENT_ADDED'
}

interface CommentDeletedAction {
  id: string
  type: 'COMMENT_DELETED'
}

interface CommentUpdatedAction {
  payload: CommentDocument | Partial<CommentPostPayload>
  type: 'COMMENT_UPDATED'
}

interface CommentsSetAction {
  comments: CommentDocument[]
  type: 'COMMENTS_SET'
}

interface CommentReceivedAction {
  payload: CommentDocument
  type: 'COMMENT_RECEIVED'
}

export type CommentsReducerAction =
  | CommentAddedAction
  | CommentDeletedAction
  | CommentUpdatedAction
  | CommentsSetAction
  | CommentReceivedAction

export interface CommentsReducerState {
  comments: Record<string, CommentDocument>
}

/**
 * Transform an array of comments into an object with the comment id as key:
 * ```
 * {
 *  'comment-1': { _id: 'comment-1', ... },
 *  'comment-2': { _id: 'comment-2', ... },
 * }
 * ```
 */
function createCommentsSet(comments: CommentDocument[]) {
  const commentsById = comments.reduce((acc, comment) => ({...acc, [comment._id]: comment}), {})
  return commentsById
}

export function commentsReducer(
  state: CommentsReducerState,
  action: CommentsReducerAction,
): CommentsReducerState {
  switch (action.type) {
    case 'COMMENTS_SET': {
      // Create an object with the comment id as key
      const commentsById = createCommentsSet(action.comments)

      return {
        ...state,
        comments: commentsById,
      }
    }

    case 'COMMENT_ADDED': {
      const nextCommentResult = action.payload as CommentDocument
      const nextCommentValue = nextCommentResult satisfies CommentDocument

      const nextComment = {
        [nextCommentResult._id]: {
          ...state.comments[nextCommentResult._id],
          ...nextCommentValue,
          _state: nextCommentResult._state || undefined,
          // If the comment is created optimistically, it won't have a createdAt date as this is set on the server.
          // However, we need to set a createdAt date to be able to sort the comments correctly.
          // Therefore, we set the createdAt date to the current date here if it's missing while creating the comment.
          // Once the comment is created and received from the server, the createdAt date will be updated to the correct value.
          _createdAt: nextCommentResult._createdAt || new Date().toISOString(),
        } satisfies CommentDocument,
      }

      return {
        ...state,
        comments: {
          ...state.comments,
          ...nextComment,
        },
      }
    }

    case 'COMMENT_RECEIVED': {
      const nextCommentResult = action.payload as CommentDocument

      return {
        ...state,
        comments: {
          ...state.comments,
          [nextCommentResult._id]: nextCommentResult,
        },
      }
    }

    case 'COMMENT_DELETED': {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {[action.id]: _, ...restComments} = state.comments

      // Delete all replies to the deleted comment
      Object.keys(restComments).forEach((commentId) => {
        if (restComments[commentId].parentCommentId === action.id) {
          delete restComments[commentId]
        }
      })

      return {
        ...state,
        comments: restComments,
      }
    }

    case 'COMMENT_UPDATED': {
      const updatedComment = action.payload
      const id = updatedComment._id as string
      const comment = state.comments[id]

      // Due to optimistic updates, we need to merge the current optimistic reactions with the
      // incoming reactions to make sure that any optimistic reactions are not lost or
      // re-added when we receive the updated comment from the server.
      const optimisticReactions = comment?.reactions?.filter((v) => v?._optimisticState) || []
      const incomingReactions = updatedComment.reactions || []
      const nextReactions = mergeCommentReactions(optimisticReactions, incomingReactions)

      const nextComment = {
        // Add existing comment data
        ...comment,
        // Add incoming comment data
        ...updatedComment,
        // Add reactions merged with optimistic reactions
        reactions: nextReactions,
      } satisfies CommentDocument

      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: nextComment,
        },
      }
    }

    default:
      return state
  }
}
