import {CheckmarkCircleIcon, EditIcon, LinkIcon, TrashIcon, UndoIcon} from '@sanity/icons'
import {Card, Flex, Menu, MenuDivider} from '@sanity/ui'
import styled from 'styled-components'
import {
  Button,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  TooltipDelayGroupProvider,
} from '../../../../../ui-components'
import {commentsLocaleNamespace} from '../../../i18n'
import {COMMENT_REACTION_OPTIONS} from '../../constants'
import {ReactionIcon} from '../icons'
import {CommentReactionsMenuButton} from '../reactions'
import type {CommentReactionOption, CommentStatus, CommentsUIMode} from '../../types'
import {ContextMenuButton, TFunction, useTranslation} from 'sanity'

const renderMenuButton = ({
  open,
  tooltipContent,
  t,
}: {
  open: boolean
  tooltipContent: string
  t: TFunction
}) => (
  <Button
    aria-label={t('list-item.context-menu-add-reaction-aria-label')}
    icon={ReactionIcon}
    mode="bleed"
    selected={open}
    tooltipProps={{content: tooltipContent}}
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
  mode: CommentsUIMode
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
    mode,
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
              mode={mode}
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
                  ? t('list-item.resolved-tooltip-aria-label')
                  : t('list-item.re-open-resolved-aria-label')
              }
              disabled={readOnly}
              icon={status === 'open' ? CheckmarkCircleIcon : UndoIcon}
              mode="bleed"
              onClick={onStatusChange}
              tooltipProps={{
                content:
                  status === 'open'
                    ? t('list-item.resolved-tooltip-content')
                    : t('list-item.re-open-resolved'),
              }}
            />
          )}

          <MenuButton
            id="comment-actions-menu"
            button={
              <ContextMenuButton
                aria-label={t('list-item.open-menu-aria-label')}
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
                  text={t('list-item.edit-comment')}
                  tooltipProps={
                    mode === 'upsell' ? {content: t('list-item.edit-comment-upsell')} : undefined
                  }
                  disabled={mode === 'upsell'}
                />

                <MenuItem
                  hidden={!canDelete}
                  icon={TrashIcon}
                  onClick={onDeleteStart}
                  text={t('list-item.delete-comment')}
                  tone="critical"
                />

                <MenuDivider hidden={!canDelete && !canEdit} />

                <MenuItem
                  hidden={!onCopyLink}
                  icon={LinkIcon}
                  onClick={onCopyLink}
                  text={t('list-item.copy-link')}
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
