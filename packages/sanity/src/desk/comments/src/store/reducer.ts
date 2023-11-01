import {CommentDocument, CommentPostPayload} from '../types'

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

/**
 * @beta
 * @hidden
 */
export type CommentsReducerAction =
  | CommentAddedAction
  | CommentDeletedAction
  | CommentUpdatedAction
  | CommentsSetAction
  | CommentReceivedAction

/**
 * @beta
 * @hidden
 */
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

/**
 * @beta
 * @hidden
 */
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
          // If the comment is created optimistically, it won't have a createdAt date.
          // In that case, we'll use the current date.
          // The correct date will be set when the comment is created on the server
          // and the comment is received in the realtime listener.
          _createdAt: nextCommentResult._createdAt || new Date().toISOString(),
        } satisfies CommentDocument,
      }

      const commentExists = state.comments && state.comments[nextCommentResult._id]

      // The comment might already exist in the store if an optimistic update
      // has been performed but the post request failed. In that case we want
      // to merge the new comment with the existing one.
      if (commentExists) {
        return {
          ...state,
          comments: {
            ...state.comments,
            ...nextComment,
          },
        }
      }

      const nextComments = {
        ...(state.comments || {}),
        ...nextComment,
      }

      return {
        ...state,
        comments: nextComments,
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

      return {
        ...state,
        comments: {
          ...state.comments,
          [id]: {
            ...state.comments[id],
            ...updatedComment,
          },
        },
      }
    }

    default:
      return state
  }
}
