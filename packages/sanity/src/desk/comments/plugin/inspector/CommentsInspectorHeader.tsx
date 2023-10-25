import {CheckmarkIcon, ChevronDownIcon, DoubleChevronRightIcon} from '@sanity/icons'
import {Button, Card, Flex, Menu, MenuButton, MenuItem, Text} from '@sanity/ui'
import {startCase} from 'lodash'
import React, {forwardRef, useCallback} from 'react'
import styled from 'styled-components'
import {BetaBadge, CommentStatus} from '../../src'

const Root = styled(Card)({
  position: 'relative',
  zIndex: 1,
  lineHeight: 0,

  '&:after': {
    content: '""',
    display: 'block',
    position: 'absolute',
    left: 0,
    bottom: -1,
    right: 0,
    borderBottom: '1px solid var(--card-border-color)',
    opacity: 0.5,
  },
})

interface CommentsInspectorHeaderProps {
  onClose: () => void
  onViewChange: (view: CommentStatus) => void
  view: CommentStatus
}

export const CommentsInspectorHeader = forwardRef(function CommentsInspectorHeader(
  props: CommentsInspectorHeaderProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  const {onClose, onViewChange, view} = props

  const handleSetOpenView = useCallback(() => onViewChange('open'), [onViewChange])
  const handleSetResolvedView = useCallback(() => onViewChange('resolved'), [onViewChange])

  return (
    <Root ref={ref}>
      <Flex padding={2}>
        <Flex align="center" flex={1} gap={2} paddingY={2} padding={3}>
          <Text as="h1" size={1} weight="semibold">
            Comments
          </Text>

          <BetaBadge />
        </Flex>

        <Flex flex="none" padding={1} gap={2}>
          <MenuButton
            id="comment-status-menu-button"
            button={
              <Button
                text={startCase(view)}
                fontSize={1}
                padding={2}
                mode="bleed"
                iconRight={ChevronDownIcon}
                space={2}
              />
            }
            menu={
              <Menu style={{width: '180px'}}>
                <MenuItem
                  fontSize={1}
                  iconRight={view === 'open' ? CheckmarkIcon : undefined}
                  onClick={handleSetOpenView}
                  text="Open comments"
                />
                <MenuItem
                  fontSize={1}
                  iconRight={view === 'resolved' ? CheckmarkIcon : undefined}
                  onClick={handleSetResolvedView}
                  text="Resolved comments"
                />
              </Menu>
            }
            popover={{placement: 'bottom-end'}}
          />

          <Button
            aria-label="Close comments"
            fontSize={1}
            icon={DoubleChevronRightIcon}
            mode="bleed"
            onClick={onClose}
            padding={2}
          />
        </Flex>
      </Flex>
    </Root>
  )
})
