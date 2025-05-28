// this file exports the public api for comments (ends up in the sanity package) – be mindful of what gets re-exported
export {
  CommentDeleteDialog,
  CommentDisabledIcon,
  CommentInlineHighlightSpan,
  CommentInput,
  type CommentInputHandle,
  type CommentInputProps,
  CommentsList,
} from './components'
export {COMMENTS_INSPECTOR_NAME} from './constants'
export {
  CommentsAuthoringPathProvider,
  CommentsEnabledProvider,
  CommentsIntentProvider,
  type CommentsIntentProviderProps,
  CommentsProvider,
  type CommentsSelectedPath,
  CommentsSelectedPathProvider,
} from './context'
export {hasCommentMessageValue, isTextSelectionComment} from './helpers'
export {
  useComments,
  useCommentsEnabled,
  useCommentsSelectedPath,
  useCommentsTelemetry,
} from './hooks'
// dont need this in the public api
//export * from './store'
export * from './types'
export {
  buildCommentRangeDecorations,
  buildRangeDecorationSelectionsFromComments,
  buildTextSelectionFromFragment,
} from './utils'
// // NOTE: don't re-export `./plugin` because it causes a circular import in config
// export * from './plugin'
