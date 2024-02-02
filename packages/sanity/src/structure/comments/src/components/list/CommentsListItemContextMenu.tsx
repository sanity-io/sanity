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
import {commentsLocaleNamespace} from '../../../i18n'
import {ContextMenuButton, TFunction, useTranslation} from 'sanity'

const renderMenuButton = ({open, t}: {open: boolean; t: TFunction}) => (
  <Button
    aria-label={t('list-item-context-menu-add-reaction-aria-label')}
    icon={ReactionIcon}
    mode="bleed"
    selected={open}
    tooltipProps={{content: t('list-item-context-menu-add-reaction')}}
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

  const {t} = useTranslation(commentsLocaleNamespace)

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
              aria-label={
                status === 'open'
                  ? t('list-item-resolved-tooltip-aria-label')
                  : t('list-item-re-open-resolved-aria-label')
              }
              disabled={readOnly}
              icon={status === 'open' ? CheckmarkCircleIcon : UndoIcon}
              mode="bleed"
              onClick={onStatusChange}
              tooltipProps={{
                content:
                  status === 'open'
                    ? t('list-item-resolved-tooltip-content')
                    : t('list-item-re-open-resolved'),
              }}
            />
          )}

          <MenuButton
            id="comment-actions-menu"
            button={
              <ContextMenuButton
                aria-label={t('list-item-open-menu-aria-label')}
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
                  text={t('list-item-edit-comment')}
                />

                <MenuItem
                  hidden={!canDelete}
                  icon={TrashIcon}
                  onClick={onDeleteStart}
                  text={t('list-item-delete-comment')}
                  tone="critical"
                />

                <MenuDivider hidden={!canDelete && !canEdit} />

                <MenuItem
                  hidden={!onCopyLink}
                  icon={LinkIcon}
                  onClick={onCopyLink}
                  text={t('list-item-copy-link')}
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
