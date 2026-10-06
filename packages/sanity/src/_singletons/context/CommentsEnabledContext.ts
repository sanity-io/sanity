import {createContext} from 'sanity/_createContext'

/**
 * Whether comments are enabled for the document being rendered, as `CommentsEnabledProvider`
 * resolves it from the workspace's `document.comments.enabled` config. Synchronous; the plan
 * check behind `CommentsModePromiseContext` only decides the mode. Defaults to `false` so that
 * document UI rendered without the provider shows no comments.
 * @internal
 */
export const CommentsEnabledContext = createContext<boolean>(
  'sanity/_singletons/context/comments-enabled',
  false,
)
