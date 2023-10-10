import {useMemo, useRef} from 'react'
import {isEqual} from 'lodash'
import {CommentMessage} from './types'

export function useCommentHasChanged(message: CommentMessage): boolean {
  const prevMessage = useRef<CommentMessage>(message)

  return useMemo(() => !isEqual(prevMessage.current, message), [message])
}
