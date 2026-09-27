import {lazy, type RefAttributes, Suspense} from 'react'

import {type CommentsListProps} from './components/list/CommentsList'
import {
  type CommentInputHandle,
  type CommentInputProps,
} from './components/pte/comment-input/CommentInput'

// Code-split facades for the comments components that `sanity` exports. Both render a Portable
// Text editor, so exporting the implementations directly kept the editor in the static import
// graph of the entry; the wrappers keep the names and props and load the implementation on first
// render behind a `Suspense` of their own. Internal code imports the implementations directly.

const LazyCommentsList = lazy(() =>
  import('./components/list/CommentsList').then((module) => ({default: module.CommentsList})),
)

/**
 * @beta
 * @hidden
 */
export function CommentsList(
  props: CommentsListProps & RefAttributes<HTMLUListElement>,
): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyCommentsList {...props} />
    </Suspense>
  )
}

const LazyCommentInput = lazy(() =>
  import('./components/pte/comment-input/CommentInput').then((module) => ({
    default: module.CommentInput,
  })),
)

/**
 * @internal
 */
export function CommentInput(
  props: CommentInputProps & RefAttributes<CommentInputHandle>,
): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyCommentInput {...props} />
    </Suspense>
  )
}
