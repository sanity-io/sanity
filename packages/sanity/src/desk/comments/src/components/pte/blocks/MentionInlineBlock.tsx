import React from 'react'
import {Tooltip, Flex, Text, TooltipProps} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {CommentsAvatar} from '../../avatars'
import {useCurrentUser, useUser} from 'sanity'

const TOOLTIP_DELAY: TooltipProps['delay'] = {open: 500, close: 0}

const Span = styled.span(({theme}) => {
  const {regular} = theme.sanity.fonts?.text.weights
  const {hovered} = theme.sanity.color?.card
  const {bg} = theme.sanity.color.selectable?.caution.pressed || {}

  return css`
    font-weight: ${regular};
    color: var(--card-link-fg-color);
    border-radius: 2px;
    background-color: ${hovered.bg};
    padding: 1px;
    box-sizing: border-box;

    &[data-active='true'] {
      background-color: ${bg};
    }
  `
})

interface MentionInlineBlockProps {
  userId: string
  selected: boolean
}

export function MentionInlineBlock(props: MentionInlineBlockProps) {
  const {selected, userId} = props
  const [user, loading] = useUser(userId)
  const currentUser = useCurrentUser()

  if (!user || loading) return <Span>@Loading</Span> // todo: improve

  return (
    <Tooltip
      portal
      open={selected}
      delay={TOOLTIP_DELAY}
      content={
        <Flex align="center" padding={2} gap={1}>
          <Flex>
            <CommentsAvatar user={user} />
          </Flex>

          <Text size={1}>{user.displayName}</Text>
        </Flex>
      }
    >
      <Span data-selected={selected} data-active={currentUser?.id === userId}>
        @{user.displayName}
      </Span>
    </Tooltip>
  )
}
