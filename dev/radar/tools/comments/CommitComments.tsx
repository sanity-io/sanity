import {CommentIcon} from '@sanity/icons/Comment'
import {Badge, Text} from '@sanity/ui'
import {useUser} from 'sanity'
import {Flex} from 'ui5'

import {commentExcerpt, type CommitComment, threadsForSha} from './comments'
import {useCommitComments} from './CommitCommentsContext'

/**
 * One thread's opening comment as a single line: the author's name (looked
 * up from the id the comment stores) and an excerpt of the message. For the
 * chart tooltip, where a finding has to be readable at hover speed; the panel
 * has the full thread.
 */
export function CommentExcerpt(props: {
  comment: CommitComment
  /** The marker's color, so the author name reads as belonging to the bubble. */
  color: string
}) {
  const {comment, color} = props
  const [user] = useUser(comment.authorId)
  return (
    <Flex alignItems="baseline" gap={2}>
      <Text size={0} muted style={{flexShrink: 0}}>
        {comment.status === 'resolved' ? 'resolved' : 'comment'}
      </Text>
      <Text size={0}>
        <span style={{color}}>{user?.displayName ?? '…'}:</span> {commentExcerpt(comment.message)}
      </Text>
    </Flex>
  )
}

/**
 * A thread-count badge for a compact row (the bisect timeline's visited
 * commits), with the excerpts as its tooltip. Nothing when there are none.
 */
export function CommitCommentCount(props: {sha: string}) {
  const threads = threadsForSha(useCommitComments(), props.sha)
  if (threads.length === 0) return null
  return (
    <Badge
      fontSize={0}
      tone="primary"
      title={threads.map((thread) => commentExcerpt(thread.message)).join('\n')}
    >
      <Flex alignItems="center" gap={1}>
        <CommentIcon />
        {threads.length}
      </Flex>
    </Badge>
  )
}
