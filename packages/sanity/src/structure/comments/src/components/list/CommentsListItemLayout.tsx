import {hues} from '@sanity/color'
import {type CurrentUser} from '@sanity/types'
import {Box, Card, Flex, Stack, Text, TextSkeleton, useClickOutside} from '@sanity/ui'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  type RelativeTimeOptions,
  Translate,
  useDateTimeFormat,
  useDidUpdate,
  useRelativeTime,
  useTranslation,
  useUser,
} from 'sanity'
import {IntentLink} from 'sanity/router'
import styled, {css} from 'styled-components'

import {commentsLocaleNamespace} from '../../../i18n'
import {hasCommentMessageValue, useCommentHasChanged} from '../../helpers'
import {
  type CommentContext,
  type CommentDocument,
  type CommentMessage,
  type CommentReactionOption,
  type CommentStatus,
  type CommentsUIMode,
  type CommentUpdatePayload,
  type MentionOptionsHookValue,
} from '../../types'
import {AVATAR_HEIGHT, CommentsAvatar, SpacerAvatar} from '../avatars'
import {FLEX_GAP} from '../constants'
import {CommentMessageSerializer} from '../pte'
import {CommentInput, type CommentInputHandle} from '../pte/comment-input'
import {CommentReactionsBar} from '../reactions'
import {CommentsListItemContextMenu} from './CommentsListItemContextMenu'
import {CommentsListItemReferencedValue} from './CommentsListItemReferencedValue'

const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()

const ContextMenuBox = styled(Box)``

const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '50%'}

const EMPTY_ARRAY: [] = []

const TimeText = styled(Text)(({theme}) => {
  const isDark = theme.sanity.color.dark
  const fg = hues.gray[isDark ? 200 : 800].hex

  return css`
    min-width: max-content;
    --card-fg-color: ${fg};
    color: var(--card-fg-color);
  `
})

const IntentText = styled(Text)(({theme}) => {
  const isDark = theme.sanity.color.dark
  const fg = hues.gray[isDark ? 200 : 800].hex

  return css`
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
      ${ContextMenuBox} {
        opacity: 0;
        position: absolute;
        right: 0;
        top: 0;
        transform: translate(${space[1]}px, -${space[1]}px);
      }

      ${ContextMenuBox} {
        &:focus-within {
          opacity: 1;
        }
      }

      &:hover {
        ${ContextMenuBox} {
          opacity: 1;
        }
      }
    }

    &[data-menu-open='true'] {
      ${ContextMenuBox} {
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
  mode: CommentsUIMode
  onCopyLink?: (id: string) => void
  onCreateRetry?: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, message: CommentUpdatePayload) => void
  onInputKeyDown?: (event: React.KeyboardEvent<Element>) => void
  onReactionSelect?: (id: string, reaction: CommentReactionOption) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  readOnly?: boolean
  intent?: CommentContext['intent']
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {useTemporalPhrase: true}

export function CommentsListItemLayout(props: CommentsListItemLayoutProps) {
  const {
    canDelete,
    canEdit,
    comment,
    currentUser,
    hasError,
    intent,
    isParent,
    isRetrying,
    mentionOptions,
    mode,
    onCopyLink,
    onCreateRetry,
    onDelete,
    onEdit,
    onInputKeyDown,
    onReactionSelect,
    onStatusChange,
    readOnly,
  } = props
  const {_createdAt, authorId, message, _id, lastEditedAt} = comment
  const [user] = useUser(authorId)
  const {t} = useTranslation(commentsLocaleNamespace)

  const [value, setValue] = useState<CommentMessage>(message)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const startMessage = useRef<CommentMessage>(message)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const commentInputRef = useRef<CommentInputHandle>(null)

  const hasChanges = useCommentHasChanged(value)
  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  // Filter out reactions that's been optimistically removed from the comment.
  const reactions = useMemo(
    () =>
      (comment?.reactions?.filter((r) => r?._optimisticState !== 'removed') || EMPTY_ARRAY).filter(
        (r) => {
          // Filter out reactions that might have to incorrect format
          return 'userId' in r && 'shortName' in r
        },
      ),
    [comment?.reactions],
  )

  const hasReactions = Boolean(reactions?.length)

  const createdDate = _createdAt ? new Date(_createdAt) : new Date()
  const editedDate = lastEditedAt ? new Date(lastEditedAt) : null
  const createdTimeAgo = useRelativeTime(createdDate, RELATIVE_TIME_OPTIONS)
  const dateTimeFormat = useDateTimeFormat({dateStyle: 'full', timeStyle: 'medium'})
  const formattedCreatedAt = dateTimeFormat.format(createdDate)
  const formattedLastEditAt = editedDate ? dateTimeFormat.format(editedDate) : null
  const displayError = hasError || isRetrying

  // If the message has changed we need to update the value in the state
  // so that, when the user starts editing, the input is populated with the
  // latest message value.
  useEffect(() => {
    if (isEditing) return

    startMessage.current = message
    setValue(message)
  }, [isEditing, message])

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

  const handleReactionSelect = useCallback(
    (reaction: CommentReactionOption) => {
      onReactionSelect?.(_id, reaction)
    },
    [_id, onReactionSelect],
  )

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

  const handleCloseMenu = useCallback(() => setMenuOpen(false), [])

  const handleClickOutside = useCallback(() => {
    if (!hasChanges) {
      cancelEdit()
    }
  }, [cancelEdit, hasChanges])

  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && !hasChanges) {
        cancelEdit()
      }
    },
    [cancelEdit, hasChanges],
  )

  useDidUpdate(isEditing, handleCloseMenu)

  useClickOutside(handleClickOutside, [rootElement])

  const name = user?.displayName ? (
    <Text size={1} weight="medium" textOverflow="ellipsis" title={user.displayName}>
      {user.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  return (
    <RootStack
      data-menu-open={menuOpen ? 'true' : 'false'}
      onKeyDown={handleRootKeyDown}
      ref={setRootElement}
      space={4}
    >
      <InnerStack space={1} data-muted={displayError}>
        <Flex align="center" gap={FLEX_GAP} flex={1}>
          <CommentsAvatar user={user} />

          <Flex direction="column" gap={2} paddingY={intent ? 2 : 0}>
            <Flex
              align="center"
              paddingBottom={comment.context?.intent ? 0 : 1}
              sizing="border"
              flex={1}
            >
              <Flex align="flex-end" gap={2}>
                <Box flex={1}>{name}</Box>

                {!displayError && (
                  <Flex align="center" gap={1}>
                    <TimeText muted size={0}>
                      <time dateTime={createdDate.toISOString()} title={formattedCreatedAt}>
                        {createdTimeAgo}
                      </time>
                    </TimeText>

                    {formattedLastEditAt && editedDate && (
                      <TimeText muted size={0} title={formattedLastEditAt}>
                        <time dateTime={editedDate.toISOString()} title={formattedLastEditAt}>
                          ({t('list-item.layout-edited')})
                        </time>
                      </TimeText>
                    )}
                  </Flex>
                )}
              </Flex>
            </Flex>

            {intent && (
              <Box flex={1}>
                <IntentText muted size={0} textOverflow="ellipsis">
                  <Translate
                    t={t}
                    i18nKey="list-item.layout-context"
                    values={{title: intent.title, intent: 'edit'}}
                    components={{
                      IntentLink: ({children}) =>
                        intent ? (
                          <IntentLink params={intent.params} intent={intent.name}>
                            {children}
                          </IntentLink>
                        ) : undefined,
                    }}
                  />
                </IntentText>
              </Box>
            )}
          </Flex>

          {!isEditing && !displayError && (
            <ContextMenuBox data-root-menu={isParent ? 'true' : 'false'} onClick={stopPropagation}>
              <CommentsListItemContextMenu
                canDelete={canDelete}
                canEdit={canEdit}
                isParent={isParent}
                mode={mode}
                onCopyLink={handleCopyLink}
                onDeleteStart={handleDelete}
                onEditStart={toggleEdit}
                onMenuClose={handleMenuClose}
                onMenuOpen={handleMenuOpen}
                onReactionSelect={handleReactionSelect}
                onStatusChange={handleOpenStatusChange}
                readOnly={readOnly}
                status={comment.status}
              />
            </ContextMenuBox>
          )}
        </Flex>

        {comment.target.path.selection?.type === 'text' && Boolean(comment?.contentSnapshot) && (
          <Flex gap={FLEX_GAP} marginBottom={3}>
            <SpacerAvatar />

            <CommentsListItemReferencedValue value={comment?.contentSnapshot} />
          </Flex>
        )}

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

        {hasReactions && (
          <Flex gap={FLEX_GAP} marginTop={2}>
            <SpacerAvatar />

            <Box onClick={stopPropagation}>
              <CommentReactionsBar
                currentUser={currentUser}
                mode={mode}
                onSelect={handleReactionSelect}
                reactions={reactions}
                readOnly={readOnly}
              />
            </Box>
          </Flex>
        )}
      </InnerStack>

      {displayError && (
        <ErrorFlex gap={FLEX_GAP}>
          <SpacerAvatar />

          <Flex align="center" gap={1} flex={1}>
            <Text muted size={1}>
              {hasError && t('list-item.layout-failed-sent')}
              {isRetrying && t('list-item.layout-posting')}
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
                  {t('list-item.layout-retry')}
                </Text>
              </RetryCardButton>
            </Flex>
          </Flex>
        </ErrorFlex>
      )}
    </RootStack>
  )
}
