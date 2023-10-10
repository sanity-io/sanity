import React from 'react'
import {CommentStatus} from '../../types'

export const EMPTY_STATE_MESSAGES: Record<
  CommentStatus,
  {title: string; message: React.ReactNode}
> = {
  open: {
    title: 'No open comments yet',
    message: (
      <span>
        Open comments on this document <br />
        will be shown here.
      </span>
    ),
  },
  resolved: {
    title: 'No resolved comments yet',
    message: (
      <>
        Resolved comments on this document <br />
        will be shown here.
      </>
    ),
  },
}
