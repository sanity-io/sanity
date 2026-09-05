import {type PortableTextBlock} from '@sanity/types'

/**
 * A reply, as far as the activity feed is concerned. The comment itself is
 * created by the comments implementation the task is using.
 */
export interface TaskCommentReply {
  message: PortableTextBlock[] | null
  parentCommentId?: string
  threadId: string
}

/**
 * A comment to create on a task, in the shape both comments implementations
 * accept, so that the task decides what a new comment looks like regardless of
 * which one is used.
 */
export interface TaskCommentCreate {
  id: string
  type: 'task'
  message: PortableTextBlock[] | null
  parentCommentId: string | undefined
  reactions: never[]
  status: 'open'
  threadId: string
  context: {
    notification: TaskCommentNotification
  }
}

/**
 * The notification context stored on a task comment, which is what the
 * notification about the comment is built from.
 */
export interface TaskCommentNotification {
  documentTitle: string
  url: string
  workspaceTitle: string
  workspaceName: string
  subscribers: string[]
}
