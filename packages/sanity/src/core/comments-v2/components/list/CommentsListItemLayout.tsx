import {hues} from '@sanity/color'
import {type CurrentUser} from '@sanity/types'
import {type AvatarSize, Card, TextSkeleton, useClickOutsideEvent} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {IntentLink} from 'sanity/router'
import {css, styled} from 'styled-components'
import {Text, Box, Flex, VStack, Icon} from 'ui5'

import {CircleSmallIcon} from '../../../components/temporary-icons/CircleSmall'
import {RingIcon} from '../../../components/temporary-icons/Ring'
import {useDidUpdate} from '../../../form/hooks/useDidUpdate'
import {useDateTimeFormat} from '../../../hooks/useDateTimeFormat'
import {type RelativeTimeOptions, useRelativeTime} from '../../../hooks/useRelativeTime'
import {type UserListWithPermissionsHookValue} from '../../../hooks/useUserListWithPermissions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {useUser} from '../../../store/user/hooks'
import {isDraftId, isPublishedId} from '../../../util/draftUtils'
import {hasCommentMessageValue, isTextSelectionComment, useCommentHasChanged} from '../../helpers'
import {useComments} from '../../hooks/useComments'
import {commentsLocaleNamespace} from '../../i18n'
import {
  type CommentContext,
  type CommentDocument,
  type CommentMessage,
  type CommentReactionOption,
  type CommentStatus,
  type CommentsUIMode,
  type CommentUpdatePayload,
} from '../../types'
import {CommentsAvatar} from '../avatars/CommentsAvatar'
import {SpacerAvatar} from '../avatars/SpacerAvatar'
import {FLEX_GAP} from '../constants'
import {CommentInput, type CommentInputHandle} from '../pte/comment-input/CommentInput'
import {CommentMessageSerializer} from '../pte/CommentMessageSerializer'
import {CommentReactionsBar} from '../reactions/CommentReactionsBar'
import {CommentsListItemContextMenu} from './CommentsListItemContextMenu'
import {CommentsListItemReferencedValue} from './CommentsListItemReferencedValue'

const stopPropagation = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()

function CommentIntentLink({
  children,
  intent,
}: {
  children?: React.ReactNode
  intent?: CommentContext['intent']
}) {
  if (!intent) return null
  return (
    <IntentLink params={intent.params} intent={intent.name}>
      {children}
    </IntentLink>
  )
}

const ContextMenuBox = styled(Box)``

const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '50%'}

const EMPTY_ARRAY: [] = []

const TimeText = styled(Text)(({theme}) => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const isDark = theme.sanity.color.dark
  const fg = hues.gray[isDark ? 200 : 800].hex

  return css`
    min-width: max-content;
    --card-fg-color: ${fg};
    color: var(--card-fg-color);
  `
})

const HeaderFlex = styled(Flex)<{$size: AvatarSize}>((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    min-height: ${theme.avatar.sizes[props.$size]?.size}px;
  `
})

const IntentText = styled(Text)(({theme}) => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const isDark = theme.sanity.color.dark
  const fg = hues.gray[isDark ? 200 : 800].hex

  return css`
    --card-fg-color: ${fg};
    color: var(--card-fg-color);
  `
})

const InnerStack = styled(VStack)`
  transition: opacity 200ms ease;

  &[data-muted='true'] {
    transition: unset;
    opacity: 0.5;
  }
`

const ErrorFlex = styled(Flex)<{$size: AvatarSize}>((props) => {
  const theme = getTheme_v2(props.theme)

  return css`
    min-height: ${theme.avatar.sizes[props.$size]?.size}px;
  `
})

const RetryCardButton = styled(Card)`
  /* Add not on hover */
  &:not(:hover) {
    background-color: transparent;
  }
`

const RootStack = styled(VStack)(({theme}) => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {space} = theme.sanity

  return css`
    position: relative;

    /* Only show the floating layer on hover when hover is supported.
    Else, the layer is always visible. */
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

const IconSlotRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &[data-status='published'] {
    --card-icon-color: var(--card-badge-positive-dot-color);
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
`

interface CommentsListItemLayoutProps {
  avatarSize?: AvatarSize
  canDelete?: boolean
  canEdit?: boolean
  comment: CommentDocument
  currentUser: CurrentUser
  hasError?: boolean
  hasReferencedValue?: boolean
  intent?: CommentContext['intent']
  isParent?: boolean
  isRetrying?: boolean
  mentionOptions: UserListWithPermissionsHookValue
  mode: CommentsUIMode
  onCopyLink?: (id: string) => void
  onCreateRetry?: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, message: CommentUpdatePayload) => void
  onInputKeyDown?: (event: React.KeyboardEvent) => void
  onReactionSelect?: (id: string, reaction: CommentReactionOption) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
  readOnly?: boolean
  withAvatar?: boolean
}

type CommentOrigin = 'draft' | 'published'

/**
 * The document a comment was made on, when that isn't the document being viewed.
 * Only draft vs published: versions and other ids return `null`.
 */
export function getForeignCommentOrigin(
  comment: CommentDocument,
  versionId: string | undefined,
): CommentOrigin | null {
  const source = comment.target?.sourceDocumentId
  if (!source || !versionId || source === versionId) return null
  if (!(isDraftId(source) || isPublishedId(source))) return null
  if (!(isDraftId(versionId) || isPublishedId(versionId))) return null
  return isDraftId(source) ? 'draft' : 'published'
}

function getOriginI18nKey(origin: CommentOrigin) {
  switch (origin) {
    case 'draft':
      return 'list-item.origin.draft'
    case 'published':
      return 'list-item.origin.published'
  }
}

const RELATIVE_TIME_OPTIONS: RelativeTimeOptions = {useTemporalPhrase: true}

export function CommentsListItemLayout(props: CommentsListItemLayoutProps) {
  const {
    avatarSize = 1,
    canDelete,
    canEdit,
    comment,
    currentUser,
    hasError,
    hasReferencedValue,
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
    withAvatar = true,
  } = props
  const {_createdAt, message, _id, lastEditedAt} = comment
  const authorId = comment._system.createdBy
  const [user] = useUser(authorId)
  const {t} = useTranslation(commentsLocaleNamespace)
  const {versionId} = useComments()
  const foreignOrigin = isParent ? getForeignCommentOrigin(comment, versionId) : null

  const [value, setValue] = useState<CommentMessage>(message)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const rootElementRef = useRef<HTMLDivElement | null>(null)
  const startMessage = useRef<CommentMessage>(message)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const commentInputRef = useRef<CommentInputHandle>(null)

  const hasChanges = useCommentHasChanged(value)
  const hasValue = useMemo(() => hasCommentMessageValue(value), [value])

  // Filter out reactions that's been optimistically removed from the comment.
  const reactions = (
    comment?.reactions?.filter((r) => r?._optimisticState !== 'removed') || EMPTY_ARRAY
  ).filter((r) => {
    // Filter out reactions that might have to incorrect format
    return 'userId' in r && 'shortName' in r
  })

  const hasReactions = Boolean(reactions?.length)

  const createdDate = _createdAt ? new Date(_createdAt) : new Date()
  const editedDate = lastEditedAt ? new Date(lastEditedAt) : null
  const createdTimeAgo = useRelativeTime(createdDate, RELATIVE_TIME_OPTIONS)
  const dateTimeFormat = useDateTimeFormat({
    dateStyle: 'full',
    timeStyle: 'medium',
  })
  const formattedCreatedAt = dateTimeFormat.format(createdDate)
  const formattedLastEditAt = editedDate ? dateTimeFormat.format(editedDate) : null
  const displayError = hasError || isRetrying

  // If the message has changed we need to update the value in the state
  // so that, when the user starts editing, the input is populated with the
  // latest message value.
  useEffect(() => {
    if (isEditing) return

    startMessage.current = message
    // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
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
    (event: React.KeyboardEvent) => {
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

  const handleEditSubmit = useCallback(
    (nextValue: CommentMessage) => {
      onEdit(_id, {message: nextValue})
      setIsEditing(false)
    },
    [_id, onEdit],
  )

  const handleOpenStatusChange = useCallback(() => {
    onStatusChange?.(_id, comment.status === 'open' ? 'resolved' : 'open')
  }, [_id, comment.status, onStatusChange])

  const toggleEdit = useCallback(() => {
    setIsEditing((v) => !v)
  }, [])

  const handleCloseMenu = useCallback(() => setMenuOpen(false), [])

  const handleRootKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape' && !hasChanges) {
        cancelEdit()
      }
    },
    [cancelEdit, hasChanges],
  )

  useDidUpdate(isEditing, handleCloseMenu)

  useClickOutsideEvent(!hasChanges && cancelEdit, () => [rootElementRef.current])

  const name = user?.displayName ? (
    <Text size={1} weight="medium" truncate={1} title={user.displayName} as="div" trim={true}>
      {user.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  return (
    <RootStack
      data-menu-open={menuOpen ? 'true' : 'false'}
      data-testid="comments-list-item-layout"
      onKeyDown={handleRootKeyDown}
      ref={rootElementRef}
      gap={4}
    >
      <InnerStack gap={1} data-muted={displayError}>
        {foreignOrigin && (
          <Flex marginBottom={2}>
            <Card border padding={1} radius={3}>
              <Flex alignItems="center" gap={1} paddingRight={1}>
                <IconSlotRoot data-status={foreignOrigin}>
                  <Icon
                    size={2}
                    icon={foreignOrigin === 'draft' ? RingIcon : CircleSmallIcon}
                    style={{margin: '-0.375rem'}}
                  />
                </IconSlotRoot>

                <Text size={0} muted weight="medium" as="div" trim={true}>
                  {t(getOriginI18nKey(foreignOrigin))}
                </Text>
              </Flex>
            </Card>
          </Flex>
        )}

        <HeaderFlex
          alignItems="center"
          gap={FLEX_GAP}
          flexBasis="0%"
          flexGrow={1}
          $size={avatarSize}
        >
          {withAvatar && <CommentsAvatar user={user} size={avatarSize} />}

          <Flex flexDirection="column" gap={2} paddingY={intent ? 2 : 0}>
            <Flex
              alignItems="center"
              paddingBottom={comment.context?.intent ? 0 : 1}
              flexBasis="0%"
              flexGrow={1}
            >
              <Flex alignItems="flex-end" gap={2}>
                <Box flexBasis="0%" flexGrow={1}>
                  {name}
                </Box>

                {!displayError && (
                  <Flex alignItems="center" gap={1}>
                    <TimeText muted size={0} forwardedAs="div" trim={true}>
                      <time dateTime={createdDate.toISOString()} title={formattedCreatedAt}>
                        {createdTimeAgo}
                      </time>
                    </TimeText>

                    {formattedLastEditAt && editedDate && (
                      <TimeText
                        muted
                        size={0}
                        title={formattedLastEditAt}
                        forwardedAs="div"
                        trim={true}
                      >
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
              <Box flexBasis="0%" flexGrow={1}>
                <IntentText muted size={0} truncate={1} forwardedAs="div" trim={true}>
                  <Translate
                    t={t}
                    i18nKey="list-item.layout-context"
                    values={{title: intent.title, intent: 'edit'}}
                    components={{IntentLink: CommentIntentLink}}
                    componentProps={{intent}}
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
                onCopyLink={onCopyLink ? handleCopyLink : undefined}
                onDeleteStart={handleDelete}
                onEditStart={toggleEdit}
                onMenuClose={handleMenuClose}
                onMenuOpen={handleMenuOpen}
                onReactionSelect={handleReactionSelect}
                onStatusChange={onStatusChange ? handleOpenStatusChange : undefined}
                readOnly={readOnly}
                status={comment.status}
              />
            </ContextMenuBox>
          )}
        </HeaderFlex>

        {isTextSelectionComment(comment) && Boolean(comment?.contentSnapshot) && (
          <Flex gap={FLEX_GAP} marginBottom={3}>
            {withAvatar && <SpacerAvatar $size={avatarSize} />}

            <CommentsListItemReferencedValue
              hasReferencedValue={hasReferencedValue}
              value={comment?.contentSnapshot}
            />
          </Flex>
        )}

        {isEditing && (
          <Flex alignItems="flex-start" gap={2}>
            {withAvatar && <SpacerAvatar $size={avatarSize} />}

            <Flex flexBasis="0%" flexGrow={1} flexDirection="column">
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
            </Flex>
          </Flex>
        )}

        {!isEditing && (
          <Flex gap={FLEX_GAP}>
            {withAvatar && <SpacerAvatar $size={avatarSize} />}

            <CommentMessageSerializer blocks={message} />
          </Flex>
        )}

        {hasReactions && (
          <Flex gap={FLEX_GAP} marginTop={2}>
            {withAvatar && <SpacerAvatar $size={avatarSize} />}

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
        <ErrorFlex gap={FLEX_GAP} $size={avatarSize}>
          {withAvatar && <SpacerAvatar $size={avatarSize} />}

          <Flex alignItems="center" gap={1} flexBasis="0%" flexGrow={1}>
            <Text muted size={1} as="div" trim={true}>
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
                <Text size={1} muted as="div" trim={true}>
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
