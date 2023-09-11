import {CommentDocument, CommentPostPayload} from '../types'

interface CommentAddedAction {
  result: CommentDocument | CommentPostPayload
  type: 'COMMENT_ADDED'
}

interface CommentDeletedAction {
  id: string
  type: 'COMMENT_DELETED'
}

interface CommentUpdatedAction {
  result: CommentDocument | Partial<CommentPostPayload>
  type: 'COMMENT_UPDATED'
}

interface CommentsSetAction {
  comments: CommentDocument[]
  type: 'COMMENTS_SET'
}

export type CommentsReducerAction =
  | CommentAddedAction
  | CommentDeletedAction
  | CommentUpdatedAction
  | CommentsSetAction

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
      const nextCommentResult = action.result as CommentDocument
      const nextComment = {[nextCommentResult._id]: nextCommentResult}

      const nextComments = {
        ...nextComment,
        ...(state.comments || {}),
      }

      return {
        ...state,
        comments: nextComments,
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
      const updatedComment = action.result
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
