import {createContext} from 'sanity/_createContext'

/**
 * Whether comments are enabled for the document being rendered, as the comments-v2
 * `CommentsEnabledProvider` resolves it from the workspace's `document.comments.enabled` config.
 * Synchronous; the plan check behind `CommentsModePromiseContext` only decides the mode. Defaults
 * to `false` so that document UI rendered without the provider shows no comments.
 * @internal
 */
export const CommentsEnabledContextV2 = createContext<boolean>(
  'sanity/_singletons/context/comments-enabled-v2',
  false,
)
