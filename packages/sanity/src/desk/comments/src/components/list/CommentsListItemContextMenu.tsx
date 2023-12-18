import React from 'react'
import {CheckmarkCircleIcon, UndoIcon, EditIcon, TrashIcon, LinkIcon} from '@sanity/icons'
import {Card, Flex, Menu, MenuDivider, TooltipDelayGroupProvider} from '@sanity/ui'
import styled from 'styled-components'
import {Button, MenuButton, MenuButtonProps, MenuItem} from '../../../../../ui-components'
import {CommentStatus} from '../../types'
import {TOOLTIP_DELAY_PROPS} from '../../../../../ui-components/tooltip/constants'
import {ContextMenuButton} from 'sanity'

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
  } = props

  const showMenuButton = Boolean(onCopyLink || onDeleteStart || onEditStart)

  return (
    <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
      <Flex>
        <FloatingCard display="flex" shadow={2} padding={1} radius={2} sizing="border">
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
