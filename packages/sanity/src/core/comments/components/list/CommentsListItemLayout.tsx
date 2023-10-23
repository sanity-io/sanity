import {
  CheckmarkCircleIcon,
  EditIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  UndoIcon,
  EyeOpenIcon,
} from '@sanity/icons'
import {
  TextSkeleton,
  Flex,
  Button,
  Stack,
  Text,
  Card,
  useGlobalKeyDown,
  Layer,
  useClickOutside,
  MenuButton,
  Menu,
  MenuItem,
  Box,
  TooltipDelayGroupProvider,
  TooltipDelayGroupProviderProps,
} from '@sanity/ui'
import React, {useCallback, useRef, useState} from 'react'
import {CurrentUser, Path} from '@sanity/types'
import styled, {css} from 'styled-components'
import {format} from 'date-fns'
import * as PathUtils from '@sanity/util/paths'
import {TimeAgoOpts, useTimeAgo} from '../../../hooks'
import {useUser} from '../../../store'
import {CommentMessageSerializer} from '../pte'
import {CommentInput} from '../pte/comment-input'
import {
  CommentDocument,
  CommentEditPayload,
  CommentMessage,
  CommentStatus,
  MentionOptionsHookValue,
} from '../../types'
import {FLEX_GAP} from '../constants'
import {useDidUpdate} from '../../../form'
import {useCommentHasChanged} from '../../helpers'
import {TextTooltip} from '../TextTooltip'
import {CommentsAvatar, SpacerAvatar} from '../avatars'

const TOOLTIP_GROUP_DELAY: TooltipDelayGroupProviderProps['delay'] = {open: 500}
const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '50%'}

const TimeText = styled(Text)`
  min-width: max-content;
`

const FloatingLayer = styled(Layer)(({theme}) => {
  const {space} = theme.sanity

  return css`
    opacity: 1;
    transform: translate(${space[1]}px, -${space[1]}px);
    // If hover is supported, the position is set to absolute (see below)
    position: static;
    right: 0;
    top: 0;
  `
})

const FloatingCard = styled(Card)(({theme}) => {
  const {space} = theme.sanity

  return css`
    gap: ${space[1] / 2}px;
    padding: ${space[1] / 2}px;

    &:empty {
      display: none;
    }
  `
})

const RootStack = styled(Stack)`
  position: relative;

  // Only show the floating layer when hover is supported.
  // Else, the layer is always visible.
  @media (hover: hover) {
    ${FloatingLayer} {
      position: absolute;

      &:not(:focus-within) {
        opacity: 0;
      }
    }

    &:hover {
      ${FloatingLayer} {
        opacity: 1;
      }
    }
  }

  &[data-menu-open='true'] {
    ${FloatingLayer} {
      opacity: 1;
    }
  }
`

interface CommentsListItemLayoutProps {
  canDelete?: boolean
  canEdit?: boolean
  comment: CommentDocument
  currentUser: CurrentUser
  isParent?: boolean
  mentionOptions: MentionOptionsHookValue
  onDelete: (id: string) => void
  onEdit: (id: string, message: CommentEditPayload) => void
  onPathFocus?: (path: Path) => void
  onStatusChange?: (id: string, status: CommentStatus) => void
}

const TIME_AGO_OPTS: TimeAgoOpts = {agoSuffix: true}

export function CommentsListItemLayout(props: CommentsListItemLayoutProps) {
  const {
    canDelete,
    canEdit,
    comment,
    currentUser,
    isParent,
    mentionOptions,
    onDelete,
    onEdit,
    onPathFocus,
    onStatusChange,
  } = props
  const {_createdAt, authorId, message, _id, lastEditedAt} = comment
  const [user] = useUser(authorId)

  const [value, setValue] = useState<CommentMessage>(message)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null)
  const [mentionMenuOpen, setMentionMenuOpen] = useState<boolean>(false)
  const startMessage = useRef<CommentMessage>(message)
  const [menuOpen, setMenuOpen] = useState<boolean>(false)

  const hasChanges = useCommentHasChanged(value)

  const createdDate = _createdAt ? new Date(_createdAt) : new Date()
  const createdTimeAgo = useTimeAgo(createdDate, TIME_AGO_OPTS)
  const formattedCreatedAt = format(createdDate, 'PPPPp')

  const formattedLastEditAt = lastEditedAt ? format(new Date(lastEditedAt), 'PPPPp') : null

  const handleMenuOpen = useCallback(() => setMenuOpen(true), [])
  const handleMenuClose = useCallback(() => setMenuOpen(false), [])

  const cancelEdit = useCallback(() => {
    setIsEditing(false)
    setValue(startMessage.current)
  }, [])

  const handleEditDiscard = useCallback(() => {
    cancelEdit()
  }, [cancelEdit])

  const handleDelete = useCallback(() => {
    onDelete(_id)
  }, [_id, onDelete])

  const handleEditSubmit = useCallback(() => {
    onEdit(_id, {
      message: value,
    })
    setIsEditing(false)
  }, [_id, onEdit, value])

  const handleOpenStatusChange = useCallback(() => {
    onStatusChange?.(_id, comment.status === 'open' ? 'resolved' : 'open')
  }, [_id, comment.status, onStatusChange])

  const toggleEdit = useCallback(() => {
    setIsEditing((v) => !v)
  }, [])

  const handlePathFocus = useCallback(() => {
    onPathFocus?.(PathUtils.fromString(comment.target.path.field))
  }, [comment.target.path.field, onPathFocus])

  useDidUpdate(isEditing, () => {
    setMenuOpen(false)
  })

  useGlobalKeyDown((event) => {
    if (event.key === 'Escape' && !mentionMenuOpen && !hasChanges) {
      cancelEdit()
    }
  })

  useClickOutside(() => {
    if (!hasChanges) {
      cancelEdit()
    }
  }, [rootElement])

  const avatar = <CommentsAvatar user={user} />

  const name = user?.displayName ? (
    <Text size={1} weight="semibold" textOverflow="ellipsis" title={user.displayName}>
      {user.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  const floatingMenuEnabled = canEdit || canDelete || isParent || onPathFocus || onStatusChange

  return (
    <RootStack
      data-comment-id={_id}
      data-menu-open={menuOpen ? 'true' : 'false'}
      ref={setRootElement}
      space={1}
    >
      <Flex align="center" gap={FLEX_GAP} flex={1}>
        {avatar}

        <Flex align="center" paddingBottom={1} sizing="border" flex={1}>
          <Flex align="flex-end" gap={2}>
            <Box flex={1}>{name}</Box>

            <Flex align="center" gap={1}>
              <TimeText size={0} muted title={formattedCreatedAt}>
                {createdTimeAgo}
              </TimeText>

              {formattedLastEditAt && (
                <TimeText size={0} muted title={formattedLastEditAt}>
                  (edited)
                </TimeText>
              )}
            </Flex>
          </Flex>
        </Flex>

        {!isEditing && (
          <TooltipDelayGroupProvider delay={TOOLTIP_GROUP_DELAY}>
            <FloatingLayer
              hidden={!floatingMenuEnabled}
              data-root-menu={isParent ? 'true' : 'false'}
            >
              <FloatingCard display="flex" shadow={2} padding={1} radius={2} sizing="border">
                {isParent && (
                  <>
                    {onPathFocus && (
                      <TextTooltip text="Go to field">
                        <Button
                          aria-label="Go to field"
                          fontSize={1}
                          icon={EyeOpenIcon}
                          mode="bleed"
                          onClick={handlePathFocus}
                          padding={2}
                        />
                      </TextTooltip>
                    )}

                    {onStatusChange && (
                      <TextTooltip
                        text={comment.status === 'open' ? 'Mark as resolved' : 'Re-open'}
                      >
                        <Button
                          aria-label="Mark comment as resolved"
                          fontSize={1}
                          icon={comment.status === 'open' ? CheckmarkCircleIcon : UndoIcon}
                          mode="bleed"
                          onClick={handleOpenStatusChange}
                          padding={2}
                        />
                      </TextTooltip>
                    )}
                  </>
                )}

                {canDelete && canEdit && (
                  <MenuButton
                    id="comment-actions-menu"
                    button={
                      <Button
                        aria-label="Open comment actions menu"
                        fontSize={1}
                        icon={EllipsisVerticalIcon}
                        mode="bleed"
                        padding={2}
                      />
                    }
                    onOpen={handleMenuOpen}
                    onClose={handleMenuClose}
                    menu={
                      <Menu>
                        <MenuItem
                          aria-label="Edit comment"
                          fontSize={1}
                          icon={EditIcon}
                          onClick={toggleEdit}
                          text="Edit comment"
                        />
                        <MenuItem
                          aria-label="Delete comment"
                          fontSize={1}
                          icon={TrashIcon}
                          onClick={handleDelete}
                          text="Delete comment"
                          tone="critical"
                        />
                      </Menu>
                    }
                    popover={{placement: 'bottom-end'}}
                  />
                )}
              </FloatingCard>
            </FloatingLayer>
          </TooltipDelayGroupProvider>
        )}
      </Flex>

      {isEditing && (
        <Flex align="flex-start" gap={2} ref={setRootElement}>
          <SpacerAvatar />

          <Stack flex={1}>
            <CommentInput
              currentUser={currentUser}
              focusOnMount
              mentionOptions={mentionOptions}
              onChange={setValue}
              onEditDiscard={handleEditDiscard}
              onMentionMenuOpenChange={setMentionMenuOpen}
              onSubmit={handleEditSubmit}
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
    </RootStack>
  )
}
