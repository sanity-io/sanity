import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Button, Flex, Stack} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CurrentUser, Path} from '@sanity/types'
import {ChevronDownIcon} from '@sanity/icons'
// import * as PathUtils from '@sanity/util/paths'
import {CommentInput, CommentInputHandle} from '../pte'
import {
  CommentCreatePayload,
  CommentDocument,
  CommentEditPayload,
  CommentMessage,
  CommentStatus,
  MentionOptionsHookValue,
} from '../../types'
import {SpacerAvatar} from '../avatars'
import {CommentsListItemLayout} from './CommentsListItemLayout'
import {ThreadCard} from './styles'

const EMPTY_ARRAY: [] = []

const MAX_COLLAPSED_REPLIES = 5

const StyledThreadCard = styled(ThreadCard)`
  // When hovering over the thread root we want to display the parent comments menu.
  // The data-root-menu attribute is used to target the menu and is applied in
  // the CommentsListItemLayout component.
  @media (hover: hover) {
    &:hover {
      [data-root-menu='true'] {
        opacity: 1;
      }
    }
  }
`

const ExpandButton = styled(Button)(({theme}) => {
  const {medium} = theme.sanity.fonts.text.weights

  return css`
    font-weight: ${medium};
  `
})

interface CommentsListItemProps {
  canReply?: boolean
  currentUser: CurrentUser
  mentionOptions: MentionOptionsHookValue
  onDelete: (id: string) => void
  onEdit: (id: string, payload: CommentEditPayload) => void
  onPathFocus?: (path: Path) => void
  onReply: (payload: CommentCreatePayload) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  parentComment: CommentDocument
  replies: CommentDocument[] | undefined
}

export function CommentsListItem(props: CommentsListItemProps) {
  const {
    canReply,
    currentUser,
    mentionOptions,
    onDelete,
    onEdit,
    onPathFocus,
    onReply,
    onStatusChange,
    parentComment,
    replies = EMPTY_ARRAY,
  } = props
  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const didExpand = useRef<boolean>(false)

  const replyInputRef = useRef<CommentInputHandle>(null)

  const handleReplySubmit = useCallback(() => {
    const nextComment: CommentCreatePayload = {
      fieldPath: parentComment.target.path.field,
      message: value,
      parentCommentId: parentComment._id,
      status: parentComment?.status || 'open',
      // Since this is a reply to an existing comment, we use the same thread ID as the parent
      threadId: parentComment.threadId,
    }

    onReply?.(nextComment)
    setValue(EMPTY_ARRAY)

    replyInputRef.current?.focus()
  }, [
    onReply,
    parentComment._id,
    parentComment?.status,
    parentComment.target.path.field,
    parentComment.threadId,
    value,
  ])

  // const handleThreadRootClick = useCallback(() => {
  //   const path = PathUtils.fromString(parentComment.target.path.field)

  //   onPathFocus?.(path)
  // }, [onPathFocus, parentComment.target.path.field])

  const cancelEdit = useCallback(() => {
    setValue(EMPTY_ARRAY)
  }, [])

  const handleExpand = useCallback(() => {
    setCollapsed(false)
    didExpand.current = true
  }, [])

  const splicedReplies = useMemo(() => {
    if (collapsed) return replies?.slice(-MAX_COLLAPSED_REPLIES)
    return replies
  }, [replies, collapsed])

  const showCollapseButton = useMemo(() => {
    if (!replies) return false
    return replies.length > MAX_COLLAPSED_REPLIES
  }, [replies])

  const expandButtonText = useMemo(() => {
    return `${replies?.length - MAX_COLLAPSED_REPLIES} more ${
      replies?.length - MAX_COLLAPSED_REPLIES === 1 ? 'comment' : 'comments'
    }`
  }, [replies?.length])

  useEffect(() => {
    if (replies.length > MAX_COLLAPSED_REPLIES && !didExpand.current) {
      setCollapsed(true)
    }
  }, [replies])

  return (
    <Stack space={2}>
      <StyledThreadCard>
        <Stack paddingBottom={canReply ? undefined : 1}>
          <Stack as="ul" space={4}>
            <Stack as="li">
              <CommentsListItemLayout
                canDelete={parentComment.authorId === currentUser.id}
                canEdit={parentComment.authorId === currentUser.id}
                comment={parentComment}
                currentUser={currentUser}
                isParent
                mentionOptions={mentionOptions}
                onDelete={onDelete}
                onEdit={onEdit}
                onPathFocus={onPathFocus}
                onStatusChange={onStatusChange}
              />
            </Stack>

            {showCollapseButton && !didExpand.current && (
              <Flex gap={1} paddingY={1} sizing="border">
                <SpacerAvatar />

                <ExpandButton
                  fontSize={1}
                  iconRight={ChevronDownIcon}
                  mode="bleed"
                  onClick={handleExpand}
                  padding={2}
                  space={2}
                  text={expandButtonText}
                />
              </Flex>
            )}

            {splicedReplies.map((reply) => (
              <Stack as="li" key={reply._id}>
                <CommentsListItemLayout
                  canDelete={reply.authorId === currentUser.id}
                  canEdit={reply.authorId === currentUser.id}
                  comment={reply}
                  currentUser={currentUser}
                  mentionOptions={mentionOptions}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              </Stack>
            ))}

            {canReply && (
              <CommentInput
                currentUser={currentUser}
                expandOnFocus
                mentionOptions={mentionOptions}
                onChange={setValue}
                onEditDiscard={cancelEdit}
                onSubmit={handleReplySubmit}
                placeholder="Reply"
                ref={replyInputRef}
                value={value}
              />
            )}
          </Stack>
        </Stack>
      </StyledThreadCard>
    </Stack>
  )
}
