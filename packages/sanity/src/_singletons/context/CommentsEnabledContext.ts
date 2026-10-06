import {createContext} from 'sanity/_createContext'

/**
 * Whether comments are enabled for the document being rendered, as the `CommentsEnabledProvider`
 * of whichever comments plugin is active resolves it from the workspace's
 * `document.comments.enabled` config (only one of the two plugins is registered at a time).
 * Synchronous; the plan check behind `CommentsModePromiseContext` only decides the mode. Defaults
 * to `false` so that document UI rendered without the provider shows no comments.
 * @internal
 */
export const CommentsEnabledContext = createContext<boolean>(
  'sanity/_singletons/context/comments-enabled',
  false,
)
