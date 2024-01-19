import {Flex, Text, Stack, Box} from '@sanity/ui'
import React, {Fragment, useMemo} from 'react'
import styled from 'styled-components'
import {COMMENT_REACTION_EMOJIS} from '../../constants'
import {CommentReactionShortNames} from '../../types'
import {Tooltip} from '../../../../../ui-components'
import {EmojiText} from './EmojiText.styled'
import {CurrentUser, useUser} from 'sanity'

const TEXT_SIZE: number | number[] = 1

const ContentStack = styled(Stack)`
  max-width: 180px;
`

const InlineText = styled(Text).attrs({size: TEXT_SIZE})`
  display: inline-block !important;
`

const TextBox = styled(Box)`
  line-height: 1;
  text-align: center;
`

interface UserDisplayNameProps {
  currentUserId: string
  isFirst?: boolean
  separator?: boolean
  userId: string
}

function UserDisplayName(props: UserDisplayNameProps) {
  const {currentUserId, isFirst, userId, separator} = props
  const [user] = useUser(userId)

  const isCurrentUser = currentUserId === userId
  const you = isFirst ? 'You' : 'you'
  const content = isCurrentUser ? you : user?.displayName ?? 'Unknown user'
  const text = separator ? `${content}, ` : content

  return <InlineText weight="medium"> {text} </InlineText>
}

interface CommentReactionsUsersTooltipProps {
  children: React.ReactNode
  currentUser: CurrentUser
  reactionName: CommentReactionShortNames
  userIds: string[]
}

export function CommentReactionsUsersTooltip(props: CommentReactionsUsersTooltipProps) {
  const {children, ...restProps} = props

  return (
    <Tooltip
      content={<CommentReactionsUsersTooltipContent {...restProps} />}
      placement="bottom"
      portal
    >
      <div>{children}</div>
    </Tooltip>
  )
}

export function CommentReactionsUsersTooltipContent(
  props: Omit<CommentReactionsUsersTooltipProps, 'children'>,
) {
  const {currentUser, reactionName, userIds} = props

  const content = useMemo(() => {
    const len = userIds.length

    if (len === 0 || !currentUser) return null

    return userIds.map((id, index) => {
      const separator = index < userIds.length - 1 && len > 2 && index !== userIds.length - 2
      const showAnd = index === len - 1 && len > 1

      return (
        <Fragment key={id}>
          {showAnd && (
            <>
              <InlineText>and </InlineText>{' '}
            </>
          )}
          <UserDisplayName
            currentUserId={currentUser.id}
            isFirst={index === 0}
            separator={separator}
            userId={id}
          />{' '}
        </Fragment>
      )
    })
  }, [currentUser, userIds])

  return (
    <ContentStack padding={1}>
      <Flex justify="center" paddingBottom={2} paddingTop={1}>
        <EmojiText size={4}>{COMMENT_REACTION_EMOJIS[reactionName]}</EmojiText>
      </Flex>

      <TextBox>
        {content} <InlineText muted>reacted with </InlineText> <wbr />{' '}
        <InlineText muted>{reactionName}</InlineText>
      </TextBox>
    </ContentStack>
  )
}
