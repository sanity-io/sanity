import {hues} from '@sanity/color'
import {
  TextSkeleton,
  Flex,
  Stack,
  Text,
  Card,
  useGlobalKeyDown,
  useClickOutside,
  Box,
  Layer,
} from '@sanity/ui'
import React, {useCallback, useMemo, useRef, useState} from 'react'
import {CurrentUser} from '@sanity/types'
import styled, {css} from 'styled-components'
import {format} from 'date-fns'
import {CommentMessageSerializer} from '../pte'
import {CommentInput, CommentInputHandle} from '../pte/comment-input'
import {
  CommentDocument,
  CommentEditPayload,
  CommentMessage,
  CommentStatus,
  MentionOptionsHookValue,
} from '../../types'
import {FLEX_GAP} from '../constants'
import {hasCommentMessageValue, useCommentHasChanged} from '../../helpers'
import {AVATAR_HEIGHT, CommentsAvatar, SpacerAvatar} from '../avatars'
import {CommentsListItemContextMenu} from './CommentsListItemContextMenu'
import {TimeAgoOpts, useTimeAgo, useUser, useDidUpdate} from 'sanity'

const ContextMenuLayer = styled(Layer)``

function StopPropagationLayer(props: React.PropsWithChildren) {
  const {children} = props

  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation()
  }, [])

  return <ContextMenuLayer onClick={handleClick}>{children}</ContextMenuLayer>
}

const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '50%'}

const TimeText = styled(Text)(({theme}) => {
  const isDark = theme.sanity.color.dark
  const fg = hues.gray[isDark ? 200 : 800].hex

  return css`
    min-width: max-content;
    --card-fg-color: ${fg};
    color: var(--card-fg-color);
  `
})

const InnerStack = styled(Stack)`
  transition: opacity 200ms ease;

  &[data-muted='true'] {
    transition: unset;
    opacity: 0.5;
  }
`

const ErrorFlex = styled(Flex)`
  min-height: ${AVATAR_HEIGHT}px;
`

const RetryCardButton = styled(Card)`
  // Add not on hover
  &:not(:hover) {
    background-color: transparent;
  }
`

const RootStack = styled(Stack)(({theme}) => {
  const {space} = theme.sanity

  return css`
    position: relative;

    // Only show the floating layer on hover when hover is supported.
    // Else, the layer is always visible.
    @media (hover: hover) {
      ${ContextMenuLayer} {
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;

        transform: translate(${space[1]}px, -${space[1]}px);
      }

      ${ContextMenuLayer} {
        &:focus-within {
          opacity: 1;
        }
      }

      &:hover {
        ${ContextMenuLayer} {
          opacity: 1;
        }
      }
    }

    &[data-menu-open='true'] {
      ${ContextMenuLayer} {
        opacity: 1;
      }
    }
  `
})

interface CommentsListItemLayoutProps {
  canDelete?: boolean
  canEdit?: boolean
  comment: CommentDocument
  currentUser: CurrentUser
  hasError?: boolean
  isParent?: boolean
  isRetrying?: boolean
  mentionOptions: MentionOptionsHookValue
  onCopyLink?: (id: string) => void
  onCreateRetry?: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, message: CommentEditPayload) => void
  onInputKeyDown?: (event: React.KeyboardEvent<Element>) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  readOnly?: boolean
}

const TIME_AGO_OPTS: TimeAgoOpts = {agoSuffix: true}

export function CommentsListItemLayout(props: CommentsListItemLayoutProps) {
  const {
    canDelete,
    canEdit,
    comment,
    currentUser,
    hasError,
    isParent,
    isRetrying,
    mentionOptions,
    onCopyLink,
    onCreateRetry,
    onDelete,
    onEdit,
    onInputKeyDown,
    onStatusChange,
    readOnly,
  } = props
  const {_createdAt, authorId, message, _id, lastEditedAt} = comment
  const [user] = useUser(authorId)

  const [value, setValue] = useState<CommentMessage>(message)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const startMessage = useRef<CommentMessage>(message)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const hasChanges = useCommentHasChanged(value)
  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  const commentInputRef = useRef<CommentInputHandle>(null)

  const createdDate = _createdAt ? new Date(_createdAt) : new Date()
  const createdTimeAgo = useTimeAgo(createdDate, TIME_AGO_OPTS)
  const formattedCreatedAt = format(createdDate, 'PPPPp')

  const formattedLastEditAt = lastEditedAt ? format(new Date(lastEditedAt), 'PPPPp') : null
  const displayError = hasError || isRetrying

  const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  const handleMenuClose = useCallback(() => setMenuOpen(false), [])
  const handleCopyLink = useCallback(() => onCopyLink?.(_id), [_id, onCopyLink])
  const handleCreateRetry = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      onCreateRetry?.(_id)
    },
    [_id, onCreateRetry],
  )
  const handleDelete = useCallback(() => onDelete(_id), [_id, onDelete])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setValue(startMessage.current)
  }, [])

  const startDiscard = useCallback(() => {
    if (!hasValue || !hasChanges) {
      cancelEdit()
      return
    }
    commentInputRef.current?.discardDialogController.open()
  }, [cancelEdit, hasChanges, hasValue])

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<Element>) => {
      // Don't act if the input already prevented this event
      if (event.isDefaultPrevented()) {
        return
      }
      // Discard the input text
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        startDiscard()
      }
      // Call parent handler
      if (onInputKeyDown) onInputKeyDown(event)
    },
    [onInputKeyDown, startDiscard],
  )

  const cancelDiscard = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
  }, [])

  const confirmDiscard = useCallback(() => {
    commentInputRef.current?.discardDialogController.close()
    cancelEdit()
  }, [cancelEdit])

  const handleEditSubmit = useCallback(() => {
    onEdit(_id, {message: value})
    setIsEditing(false)
  }, [_id, onEdit, value])

  const handleOpenStatusChange = useCallback(() => {
    onStatusChange?.(_id, comment.status === 'open' ? 'resolved' : 'open')
  }, [_id, comment.status, onStatusChange])

  const toggleEdit = useCallback(() => {
    setIsEditing((v) => !v)
  }, [])

  useDidUpdate(
    isEditing,
    useCallback(() => {
      setMenuOpen(false)
    }, []),
  )

  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (event.key === 'Escape' && !hasChanges) {
          cancelEdit()
        }
      },
      [cancelEdit, hasChanges],
    ),
  )

  useClickOutside(
    useCallback(() => {
      if (!hasChanges) {
        cancelEdit()
      }
    }, [cancelEdit, hasChanges]),
    [rootElement],
  )

  const name = user?.displayName ? (
    <Text size={1} weight="semibold" textOverflow="ellipsis" title={user.displayName}>
      {user.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  return (
    <RootStack data-menu-open={menuOpen ? 'true' : 'false'} ref={setRootElement} space={4}>
      <InnerStack space={1} data-muted={displayError}>
        <Flex align="center" gap={FLEX_GAP} flex={1}>
          <CommentsAvatar user={user} />

          <Flex align="center" paddingBottom={1} sizing="border" flex={1}>
            <Flex align="flex-end" gap={2}>
              <Box flex={1}>{name}</Box>

              {!displayError && (
                <Flex align="center" gap={1}>
                  <TimeText muted size={0} title={formattedCreatedAt}>
                    {createdTimeAgo}
                  </TimeText>

                  {formattedLastEditAt && (
                    <TimeText muted size={0} title={formattedLastEditAt}>
                      (edited)
                    </TimeText>
                  )}
                </Flex>
              )}
            </Flex>
          </Flex>

          {!isEditing && !displayError && (
            <StopPropagationLayer>
              <CommentsListItemContextMenu
                canDelete={canDelete}
                canEdit={canEdit}
                isParent={isParent}
                onCopyLink={handleCopyLink}
                onDeleteStart={handleDelete}
                onEditStart={toggleEdit}
                onMenuClose={handleMenuClose}
                onMenuOpen={handleMenuOpen}
                onStatusChange={handleOpenStatusChange}
                readOnly={readOnly}
                status={comment.status}
              />
            </StopPropagationLayer>
          )}
        </Flex>

        {isEditing && (
          <Flex align="flex-start" gap={2}>
            <SpacerAvatar />

            <Stack flex={1}>
              <CommentInput
                currentUser={currentUser}
                focusOnMount
                mentionOptions={mentionOptions}
                onChange={setValue}
                onDiscardCancel={cancelDiscard}
                onDiscardConfirm={confirmDiscard}
                onKeyDown={handleInputKeyDown}
                onSubmit={handleEditSubmit}
                readOnly={readOnly}
                ref={commentInputRef}
                value={value}
                withAvatar={false}
              />
            </Stack>
          </Flex>
        )}

        {!isEditing && (
          <Flex gap={FLEX_GAP}>
            <SpacerAvatar />

            <CommentMessageSerializer blocks={message} />
          </Flex>
        )}
      </InnerStack>

      {displayError && (
        <ErrorFlex gap={FLEX_GAP}>
          <SpacerAvatar />

          <Flex align="center" gap={1} flex={1}>
            <Text muted size={1}>
              {hasError && 'Failed to send.'}
              {isRetrying && 'Posting...'}
            </Text>

            <Flex hidden={isRetrying}>
              <RetryCardButton
                __unstable_focusRing
                display="flex"
                forwardedAs="button"
                onClick={handleCreateRetry}
                padding={1}
                radius={2}
                tone="primary"
              >
                <Text size={1} muted>
                  Retry
                </Text>
              </RetryCardButton>
            </Flex>
          </Flex>
        </ErrorFlex>
      )}
    </RootStack>
  )
}
