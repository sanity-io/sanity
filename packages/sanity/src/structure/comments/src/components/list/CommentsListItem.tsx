import {ChevronDownIcon} from '@sanity/icons'
import {type CurrentUser} from '@sanity/types'
import {Flex, Stack, useLayer} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {type UserListWithPermissionsHookValue, useTranslation} from 'sanity'
import styled, {css} from 'styled-components'

import {Button} from '../../../../../ui-components'
import {commentsLocaleNamespace} from '../../../i18n'
import {type CommentsSelectedPath} from '../../context'
import {commentIntentIfDiffers, hasCommentMessageValue} from '../../helpers'
import {applyCommentIdAttr} from '../../hooks'
import {
  type CommentCreatePayload,
  type CommentDocument,
  type CommentMessage,
  type CommentReactionOption,
  type CommentStatus,
  type CommentsUIMode,
  type CommentUpdatePayload,
} from '../../types'
import {SpacerAvatar} from '../avatars'
import {CommentInput, type CommentInputHandle} from '../pte'
import {CommentsListItemLayout} from './CommentsListItemLayout'
import {ThreadCard} from './styles'

const EMPTY_ARRAY: [] = []

const MAX_COLLAPSED_REPLIES = 5

// data-active = when the comment is selected
// data-hovered = when the mouse is over the comment
const StyledThreadCard = styled(ThreadCard)(() => {
  return css`
    position: relative;

    &:has(> [data-ui='GhostButton']:focus:focus-visible) {
      box-shadow:
        inset 0 0 0 1px var(--card-border-color),
        0 0 0 1px var(--card-bg-color),
        0 0 0 2px var(--card-focus-ring-color);
    }

    // The hover styles is managed with the [data-hovered] attribute instead of the :hover pseudo class
    // since we want to show the hover styles when hovering over the menu items in the context menu as well.
    // The context menu is rendered using a portal, so the :hover pseudo class won't work when hovering over
    // the menu items.
    &:not([data-active='true']) {
      @media (hover: hover) {
        &[data-hovered='true'] {
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

const GhostButton = styled.button`
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
  mentionOptions: UserListWithPermissionsHookValue
  mode: CommentsUIMode
  onCopyLink?: (id: string) => void
  onCreateRetry: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, payload: CommentUpdatePayload) => void
  onKeyDown?: (event: React.KeyboardEvent<Element>) => void
  onPathSelect?: (nextPath: CommentsSelectedPath) => void
  onReactionSelect?: (id: string, reaction: CommentReactionOption) => void
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
    onReactionSelect,
    onReply,
    onStatusChange,
    parentComment,
    readOnly,
    replies = EMPTY_ARRAY,
    mode,
  } = props
  const {t} = useTranslation(commentsLocaleNamespace)
  const [value, setValue] = useState<CommentMessage>(EMPTY_ARRAY)
  const [collapsed, setCollapsed] = useState<boolean>(true)
  const didExpand = useRef<boolean>(false)
  const replyInputRef = useRef<CommentInputHandle>(null)

  const {isTopLayer} = useLayer()

  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const [mouseOver, setMouseOver] = useState<boolean>(false)

  const handleMouseEnter = useCallback(() => setMouseOver(true), [])
  const handleMouseLeave = useCallback(() => setMouseOver(false), [])

  const handleReplySubmit = useCallback(() => {
    const nextComment: CommentCreatePayload = {
      fieldPath: parentComment.target.path.field,
      message: value,
      parentCommentId: parentComment._id,
      status: parentComment?.status || 'open',
      // Since this is a reply to an existing comment, we use the same thread ID as the parent
      threadId: parentComment.threadId,
      // A new comment will not have any reactions
      reactions: EMPTY_ARRAY,
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

  const handleThreadRootClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()

      // Don't act if the click was caused by clicking
      // outside e.g. a popover or a menu
      if (!isTopLayer) return

      onPathSelect?.({
        fieldPath: parentComment.target.path.field,
        origin: 'inspector',
        threadId: parentComment.threadId,
      })
    },
    [isTopLayer, onPathSelect, parentComment.target.path.field, parentComment.threadId],
  )

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
        <Stack as="li" key={reply._id} {...applyCommentIdAttr(reply._id)}>
          <CommentsListItemLayout
            canDelete={reply.authorId === currentUser.id}
            canEdit={reply.authorId === currentUser.id}
            comment={reply}
            currentUser={currentUser}
            hasError={reply._state?.type === 'createError'}
            isRetrying={reply._state?.type === 'createRetrying'}
            mentionOptions={mentionOptions}
            mode={mode}
            onCopyLink={onCopyLink}
            onCreateRetry={onCreateRetry}
            onDelete={onDelete}
            onEdit={onEdit}
            onInputKeyDown={handleInputKeyDown}
            onReactionSelect={onReactionSelect}
            readOnly={readOnly}
            intent={commentIntentIfDiffers(parentComment, reply)}
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
      onReactionSelect,
      parentComment,
      readOnly,
      splicedReplies,
      mode,
    ],
  )

  return (
    <Stack space={2}>
      <StyledThreadCard
        data-active={isSelected ? 'true' : 'false'}
        data-hovered={mouseOver ? 'true' : 'false'}
        onClick={handleThreadRootClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <GhostButton
          data-ui="GhostButton"
          aria-label={t('list-item.go-to-field-button.aria-label')}
        />

        <Stack
          as="ul"
          // Add some extra padding to the bottom if there is no reply input.
          // This is to make the UI look more balanced.
          paddingBottom={canReply ? undefined : 1}
          space={4}
        >
          <Stack as="li" {...applyCommentIdAttr(parentComment._id)}>
            <CommentsListItemLayout
              canDelete={parentComment.authorId === currentUser.id}
              canEdit={parentComment.authorId === currentUser.id}
              comment={parentComment}
              currentUser={currentUser}
              hasError={parentComment._state?.type === 'createError'}
              isParent
              isRetrying={parentComment._state?.type === 'createRetrying'}
              mentionOptions={mentionOptions}
              mode={mode}
              onCopyLink={onCopyLink}
              onCreateRetry={onCreateRetry}
              onDelete={onDelete}
              onEdit={onEdit}
              onInputKeyDown={onKeyDown}
              onReactionSelect={onReactionSelect}
              onStatusChange={onStatusChange}
              readOnly={readOnly}
              intent={parentComment.context?.intent}
            />
          </Stack>

          {showCollapseButton && !didExpand.current && (
            <Flex gap={1} paddingY={1} sizing="border">
              <SpacerAvatar />

              <ExpandButton
                iconRight={ChevronDownIcon}
                mode="bleed"
                onClick={handleExpand}
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
              placeholder={
                mode === 'upsell'
                  ? t('compose.reply-placeholder-upsell')
                  : t('compose.reply-placeholder')
              }
              readOnly={readOnly || mode === 'upsell'}
              ref={replyInputRef}
              value={value}
            />
          )}
        </Stack>
      </StyledThreadCard>
    </Stack>
  )
})
