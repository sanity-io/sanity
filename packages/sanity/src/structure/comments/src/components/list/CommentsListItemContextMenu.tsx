import {CheckmarkCircleIcon, UndoIcon, EditIcon, TrashIcon, LinkIcon} from '@sanity/icons'
import {Card, Flex, Menu, MenuDivider} from '@sanity/ui'
import styled from 'styled-components'
import {
  Button,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  TooltipDelayGroupProvider,
} from '../../../../../ui-components'
import {CommentReactionOption, CommentStatus} from '../../types'
import {CommentReactionsMenuButton} from '../reactions'
import {COMMENT_REACTION_OPTIONS} from '../../constants'
import {ReactionIcon} from '../icons'
import {useCommentsEnabled} from '../../hooks'
import {CommentsEnabledContextValue} from '../../context/enabled/types'
import {ContextMenuButton} from 'sanity'

const renderMenuButton = ({
  open,
  commentsEnabled,
}: {
  open: boolean
  commentsEnabled: CommentsEnabledContextValue
}) => (
  <Button
    aria-label="Add reaction"
    icon={ReactionIcon}
    mode="bleed"
    selected={open}
    tooltipProps={
      commentsEnabled.reason === 'upsell'
        ? {content: 'Upgrade to add reactions'}
        : {content: 'Add reaction'}
    }
  />
)

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  placement: 'bottom-end',
}

const FloatingCard = styled(Card)`
  &:empty {
    display: none;
  }
`

interface CommentsListItemContextMenuProps {
  canDelete: boolean | undefined
  canEdit: boolean | undefined
  isParent: boolean | undefined
  onCopyLink?: () => void
  onDeleteStart?: () => void
  onEditStart?: () => void
  onMenuClose?: () => void
  onMenuOpen?: () => void
  onReactionSelect?: (option: CommentReactionOption) => void
  onStatusChange?: () => void
  readOnly?: boolean
  status: CommentStatus
}

export function CommentsListItemContextMenu(props: CommentsListItemContextMenuProps) {
  const commentsEnabled = useCommentsEnabled()
  const {
    canDelete,
    canEdit,
    isParent,
    onCopyLink,
    onDeleteStart,
    onEditStart,
    onMenuClose,
    onMenuOpen,
    onReactionSelect,
    onStatusChange,
    readOnly,
    status,
  } = props

  const showMenuButton = Boolean(onCopyLink || onDeleteStart || onEditStart)

  return (
    <TooltipDelayGroupProvider>
      <Flex>
        <FloatingCard display="flex" shadow={2} padding={1} radius={2} sizing="border">
          {onReactionSelect && (
            <CommentReactionsMenuButton
              onMenuClose={onMenuClose}
              onMenuOpen={onMenuOpen}
              onSelect={onReactionSelect}
              options={COMMENT_REACTION_OPTIONS}
              readOnly={readOnly}
              renderMenuButton={renderMenuButton}
            />
          )}

          {isParent && (
            <Button
              aria-label={status === 'open' ? 'Mark comment as resolved' : 'Re-open'}
              disabled={readOnly}
              icon={status === 'open' ? CheckmarkCircleIcon : UndoIcon}
              mode="bleed"
              onClick={onStatusChange}
              tooltipProps={{content: status === 'open' ? 'Mark as resolved' : 'Re-open'}}
            />
          )}

          <MenuButton
            id="comment-actions-menu"
            button={
              <ContextMenuButton
                aria-label="Open comment actions menu"
                disabled={readOnly}
                hidden={!showMenuButton}
              />
            }
            onOpen={onMenuOpen}
            onClose={onMenuClose}
            menu={
              <Menu>
                <MenuItem
                  hidden={!canEdit}
                  icon={EditIcon}
                  onClick={onEditStart}
                  text="Edit comment"
                  tooltipProps={
                    commentsEnabled.reason === 'upsell'
                      ? {content: 'Upgrade to edit comments'}
                      : undefined
                  }
                  disabled={commentsEnabled.reason === 'upsell'}
                />

                <MenuItem
                  hidden={!canDelete}
                  icon={TrashIcon}
                  onClick={onDeleteStart}
                  text="Delete comment"
                  tone="critical"
                />

                <MenuDivider hidden={!canDelete && !canEdit} />

                <MenuItem
                  hidden={!onCopyLink}
                  icon={LinkIcon}
                  onClick={onCopyLink}
                  text="Copy link to comment"
                />
              </Menu>
            }
            popover={POPOVER_PROPS}
          />
        </FloatingCard>
      </Flex>
    </TooltipDelayGroupProvider>
  )
}
