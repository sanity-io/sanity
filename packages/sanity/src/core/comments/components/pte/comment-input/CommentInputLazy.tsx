import {forwardRef, lazy, Suspense} from 'react'

import {type CommentInputHandle, type CommentInputProps} from './CommentInput'
import {CommentInputPlaceholder} from './CommentInputPlaceholder'

const LazyCommentInput = lazy(() =>
  import('./CommentInput').then((mod) => ({default: mod.CommentInput})),
)

export const CommentInput = forwardRef<CommentInputHandle, CommentInputProps>(
  function CommentInput(props, ref) {
    return (
      <Suspense
        fallback={
          <CommentInputPlaceholder
            avatarSize={props.avatarSize}
            currentUser={props.currentUser}
            onSubmit={props.onSubmit}
            placeholder={props.placeholder}
            withAvatar={props.withAvatar}
          />
        }
      >
        <LazyCommentInput ref={ref} {...props} />
      </Suspense>
    )
  },
)

export type {CommentInputHandle, CommentInputProps} from './CommentInput'
