import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Button, Flex, Stack} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CurrentUser} from '@sanity/types'
import {ChevronDownIcon} from '@sanity/icons'
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
import {hasCommentMessageValue} from '../../helpers'
import {CommentsSelectedPath} from '../../context'
import {CommentsListItemLayout} from './CommentsListItemLayout'
import {ThreadCard} from './styles'

const EMPTY_ARRAY: [] = []

const MAX_COLLAPSED_REPLIES = 5

const StyledThreadCard = styled(ThreadCard)(({theme}) => {
  const {hovered} = theme.sanity.color.button.bleed.default

  return css`
    position: relative;

    &:has(> [data-ui='GhostButton']:focus:focus-visible) {
      box-shadow:
        inset 0 0 0 1px var(--card-border-color),
        0 0 0 1px var(--card-bg-color),
        0 0 0 3px var(--card-focus-ring-color);
    }

    // When hovering over the thread root we want to display the parent comments menu.
    // The data-root-menu attribute is used to target the menu and is applied in
    // the CommentsListItemLayout component.
    &:not([data-active='true']) {
      @media (hover: hover) {
        &:hover {
          --card-bg-color: ${hovered.bg2};

          [data-root-menu='true'] {
            opacity: 1;
          }
        }
      }
    }
  `
})

const ExpandButton = styled(Button)(({theme}) => {
  const {medium} = theme.sanity.fonts.text.weights

  return css`
    font-weight: ${medium};
  `
})

const GhostButton = styled(Button)`
  opacity: 0;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  left: 0;
`

interface CommentsListItemProps {
  canReply?: boolean
  currentUser: CurrentUser
  isSelected: boolean
  mentionOptions: MentionOptionsHookValue
  onCopyLink?: (id: string) => void
  onCreateRetry: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, payload: CommentEditPayload) => void
  onKeyDown?: (event: React.KeyboardEvent<Element>) => void
  onPathSelect?: (nextPath: CommentsSelectedPath) => void
  onReply: (payload: CommentCreatePayload) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  parentComment: CommentDocument
  readOnly?: boolean
  replies: CommentDocument[] | undefined
}

export const CommentsListItem = React.memo(function CommentsListItem(props: CommentsListItemProps) {
  const {
    canReply,
    currentUser,
    isSelected,
    mentionOptions,
    onCopyLink,
    onCreateRetry,
    onDelete,
    onEdit,
    onKeyDown,
    onPathSelect,
    onReply,
    onStatusChange,
    parentComment,
    readOnly,
    replies = EMPTY_ARRAY,
  } = props
  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const didExpand = useRef<boolean>(false)
  const replyInputRef = useRef<CommentInputHandle>(null)

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

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
  }, [
    onReply,
    parentComment._id,
    parentComment?.status,
    parentComment.target.path.field,
    parentComment.threadId,
    value,
  ])

  const startDiscard = useCallback(() => {
    if (!hasValue) {
      setValue(EMPTY_ARRAY)
      return
    }

    replyInputRef.current?.discardDialogController.open()
  }, [hasValue])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      // Don't act if the input already prevented this event
      if (event.isDefaultPrevented()) {
        return
      }
      // Discard input text with Escape
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        startDiscard()
      }
    },
    [startDiscard],
  )

  const cancelDiscard = useCallback(() => {
    replyInputRef.current?.discardDialogController.close()
  }, [])

  const confirmDiscard = useCallback(() => {
    setValue(EMPTY_ARRAY)
    replyInputRef.current?.discardDialogController.close()
    replyInputRef.current?.focus()
  }, [])

  const handleThreadRootClick = useCallback(() => {
    onPathSelect?.({
      fieldPath: parentComment.target.path.field,
      target: 'comment-item',
      selectedFrom: 'comment-item',
      threadId: parentComment.threadId,
    })
  }, [onPathSelect, parentComment.target.path.field, parentComment.threadId])

  const handleExpand = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
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

  const renderedReplies = useMemo(
    () =>
      splicedReplies.map((reply) => (
        <Stack as="li" key={reply._id} data-comment-id={reply._id}>
          <CommentsListItemLayout
            canDelete={reply.authorId === currentUser.id}
            canEdit={reply.authorId === currentUser.id}
            comment={reply}
            currentUser={currentUser}
            hasError={reply._state?.type === 'createError'}
            isRetrying={reply._state?.type === 'createRetrying'}
            mentionOptions={mentionOptions}
            onInputKeyDown={handleInputKeyDown}
            onCopyLink={onCopyLink}
            onCreateRetry={onCreateRetry}
            onDelete={onDelete}
            onEdit={onEdit}
            readOnly={readOnly}
          />
        </Stack>
      )),
    [
      currentUser,
      handleInputKeyDown,
      mentionOptions,
      onCopyLink,
      onCreateRetry,
      onDelete,
      onEdit,
      readOnly,
      splicedReplies,
    ],
  )

  return (
    <Stack space={2}>
      <StyledThreadCard
        data-active={isSelected ? 'true' : 'false'}
        onClick={handleThreadRootClick}
        tone={isSelected ? 'primary' : undefined}
      >
        <GhostButton data-ui="GhostButton" aria-label="Go to field" />

        <Stack
          as="ul"
          // Add some extra padding to the bottom if there is no reply input.
          // This is to make the UI look more balanced.
          paddingBottom={canReply ? undefined : 1}
          space={4}
        >
          <Stack as="li" data-comment-id={parentComment._id}>
            <CommentsListItemLayout
              canDelete={parentComment.authorId === currentUser.id}
              canEdit={parentComment.authorId === currentUser.id}
              comment={parentComment}
              currentUser={currentUser}
              hasError={parentComment._state?.type === 'createError'}
              isParent
              isRetrying={parentComment._state?.type === 'createRetrying'}
              mentionOptions={mentionOptions}
              onCopyLink={onCopyLink}
              onCreateRetry={onCreateRetry}
              onDelete={onDelete}
              onEdit={onEdit}
              onInputKeyDown={onKeyDown}
              onStatusChange={onStatusChange}
              readOnly={readOnly}
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

          {renderedReplies}

          {canReply && (
            <CommentInput
              currentUser={currentUser}
              expandOnFocus
              mentionOptions={mentionOptions}
              onChange={setValue}
              onDiscardCancel={cancelDiscard}
              onDiscardConfirm={confirmDiscard}
              onKeyDown={handleInputKeyDown}
              onSubmit={handleReplySubmit}
              placeholder="Reply"
              readOnly={readOnly}
              ref={replyInputRef}
              value={value}
            />
          )}
        </Stack>
      </StyledThreadCard>
    </Stack>
  )
})
