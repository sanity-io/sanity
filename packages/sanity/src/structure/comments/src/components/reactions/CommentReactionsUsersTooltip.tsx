import {Box, Flex, Stack, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {Tooltip} from '../../../../../ui-components'
import {commentsLocaleNamespace} from '../../../i18n'
import {COMMENT_REACTION_EMOJIS} from '../../constants'
import type {CommentReactionShortNames} from '../../types'
import {EmojiText} from './EmojiText.styled'
import {Translate, useListFormat, useTranslation, useUser, type CurrentUser} from 'sanity'

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
  userId: string
}

function UserDisplayName(props: UserDisplayNameProps): string {
  const {currentUserId, isFirst, userId} = props
  const [user] = useUser(userId)
  const {t} = useTranslation(commentsLocaleNamespace)

  const isCurrentUser = currentUserId === userId
  if (isCurrentUser) {
    const context = isFirst ? 'leading' : undefined
    return t('reactions.user-list.you', {context, replace: {name: user?.displayName}})
  }

  return user?.displayName || t('reactions.user-list.unknown-user-fallback-name')
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
  const {t} = useTranslation(commentsLocaleNamespace)
  const listFormat = useListFormat({style: 'long', type: 'conjunction'})

  const UserList = useCallback(() => {
    const len = userIds.length

    if (len === 0 || !currentUser) return null

    return (
      <>
        {listFormat.formatToParts(userIds).map((item, index) =>
          item.type === 'element' ? (
            <InlineText weight="medium" key={item.value}>
              <UserDisplayName
                currentUserId={currentUser.id}
                isFirst={index === 0}
                userId={item.value}
              />
            </InlineText>
          ) : (
            <>
              <InlineText key={item.value}> {item.value} </InlineText>{' '}
            </>
          ),
        )}
      </>
    )
  }, [currentUser, listFormat, userIds])

  return (
    <ContentStack padding={1}>
      <Flex justify="center" paddingBottom={2} paddingTop={1}>
        <EmojiText size={4}>{COMMENT_REACTION_EMOJIS[reactionName]}</EmojiText>
      </Flex>

      <TextBox>
        <Translate
          t={t}
          i18nKey="reactions.users-reacted-with-reaction"
          values={{reactionName}}
          components={{
            UserList,
            ReactionName: () => <InlineText muted>{reactionName}</InlineText>,
            Text: ({children}) => (
              <>
                <InlineText muted>{children}</InlineText> <wbr />{' '}
              </>
            ),
          }}
        />
      </TextBox>
    </ContentStack>
  )
}
