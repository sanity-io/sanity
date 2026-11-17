import {useTelemetry} from '@sanity/telemetry/react'
import {useCallback, useMemo} from 'react'

import {
  CommentLinkCopied,
  CommentListViewChanged,
  CommentViewedFromLink,
} from '../__telemetry__/comments.telemetry'
import {type CommentStatus} from '../types'

interface CommentsTelemetryHookValue {
  commentLinkCopied: () => void
  commentListViewChanged: (view: CommentStatus) => void
  commentViewedFromLink: () => void
}

/** @internal */
export function useCommentsTelemetry(): CommentsTelemetryHookValue {
  const telemetry = useTelemetry()

  const commentLinkCopied = useCallback(() => {
    telemetry.log(CommentLinkCopied)
  }, [telemetry])

  const commentViewedFromLink = useCallback(() => {
    telemetry.log(CommentViewedFromLink)
  }, [telemetry])

  const commentListViewChanged = useCallback(
    (view: CommentStatus) => {
      telemetry.log(CommentListViewChanged, {view})
    },
    [telemetry],
  )

  return useMemo(
    (): CommentsTelemetryHookValue => ({
      commentLinkCopied,
      commentListViewChanged,
      commentViewedFromLink,
    }),
    [commentLinkCopied, commentListViewChanged, commentViewedFromLink],
  )
}
