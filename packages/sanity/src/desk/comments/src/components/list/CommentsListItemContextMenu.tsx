import React from 'react'
import {
  CheckmarkCircleIcon,
  UndoIcon,
  EllipsisVerticalIcon,
  EditIcon,
  TrashIcon,
  LinkIcon,
} from '@sanity/icons'
import {
  TooltipDelayGroupProviderProps,
  MenuButtonProps,
  TooltipDelayGroupProvider,
  Button,
  MenuButton,
  Menu,
  MenuItem,
  MenuDivider,
  Layer,
  Card,
} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CommentStatus} from '../../types'
import {TextTooltip} from '../TextTooltip'

const TOOLTIP_GROUP_DELAY: TooltipDelayGroupProviderProps['delay'] = {open: 500}
const POPOVER_PROPS: MenuButtonProps['popover'] = {placement: 'bottom-end'}

const FloatingLayer = styled(Layer)`
  display: flex;
`

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

interface CommentsListItemContextMenuProps {
  canDelete: boolean | undefined
  canEdit: boolean | undefined
  isParent: boolean | undefined
  onCopyLink?: () => void
  onDeleteStart?: () => void
  onEditStart?: () => void
  onMenuClose?: () => void
  onMenuOpen?: () => void
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
    onStatusChange,
    readOnly,
    status,
    ...rest
  } = props

  const showMenuButton = Boolean(onCopyLink || onDeleteStart || onEditStart)

  return (
    <TooltipDelayGroupProvider delay={TOOLTIP_GROUP_DELAY}>
      <FloatingLayer data-root-menu={isParent ? 'true' : 'false'} {...rest}>
        <FloatingCard display="flex" shadow={2} padding={1} radius={2} sizing="border">
          {isParent && (
            <TextTooltip text={status === 'open' ? 'Mark as resolved' : 'Re-open'}>
              <Button
                aria-label="Mark comment as resolved"
                disabled={readOnly}
                fontSize={1}
                icon={status === 'open' ? CheckmarkCircleIcon : UndoIcon}
                mode="bleed"
                onClick={onStatusChange}
                padding={2}
              />
            </TextTooltip>
          )}

          <MenuButton
            id="comment-actions-menu"
            button={
              <Button
                aria-label="Open comment actions menu"
                disabled={readOnly}
                fontSize={1}
                hidden={!showMenuButton}
                icon={EllipsisVerticalIcon}
                mode="bleed"
                padding={2}
              />
            }
            onOpen={onMenuOpen}
            onClose={onMenuClose}
            menu={
              <Menu>
                <MenuItem
                  fontSize={1}
                  hidden={!canEdit}
                  icon={EditIcon}
                  onClick={onEditStart}
                  text="Edit comment"
                />

                <MenuItem
                  fontSize={1}
                  hidden={!canDelete}
                  icon={TrashIcon}
                  onClick={onDeleteStart}
                  text="Delete comment"
                  tone="critical"
                />

                <MenuDivider hidden={!canDelete && !canEdit} />

                <MenuItem
                  fontSize={1}
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
      </FloatingLayer>
    </TooltipDelayGroupProvider>
  )
}
