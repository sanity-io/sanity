import {type CurrentUser} from '@sanity/types'
import {Box, Flex, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../ui-components'
import {useListFormat} from '../../../hooks'
import {Translate, useTranslation} from '../../../i18n'
import {useUser} from '../../../store'
import {COMMENT_REACTION_EMOJIS} from '../../constants'
import {commentsLocaleNamespace} from '../../i18n'
import {type CommentReactionShortNames} from '../../types'
import {EmojiText} from './EmojiText.styled'

const TEXT_SIZE: number | number[] = 1

const ContentStack = styled(Stack)`
  max-width: 180px;
`

const TextGroup = styled.div`
  display: inline-block;
`

const InlineText = styled(Text).attrs({size: TEXT_SIZE})`
  display: inline-block !important;

  & > span {
    white-space: break-spaces;
  }
`

const TextBox = styled(Box)`
  line-height: 1;
  text-align: center;
`

const LEADING_NON_WHITESPACE_RE = /^\S+/

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

function FormattedUserList({currentUserId, userIds}: {currentUserId: string; userIds: string[]}) {
  const listFormat = useListFormat({style: 'long', type: 'conjunction'})
  if (userIds.length === 0) return null

  /**
   * We need to do some surgery on the list: in some locales (such as en-US), the literal segments
   * can contain oxford commas, which we want to include as the part of the element preceeding it.
   * This ensures that we do not wrap to a new line that starts with a comma. In general, we should
   * not special case on _comma_ per se, but rather by the presence of a non-whitespace character.
   */
  const parts = listFormat.formatToParts(userIds)
  const elements: React.JSX.Element[] = []
  for (let i = 0; i < parts.length; i++) {
    const item = parts[i]

    if (item.type === 'literal') {
      // Add literals as-is - the next case will rewrite literals to exclude leading non-whitespace
      elements.push(<InlineText key={`literal-${i}`}>{item.value}</InlineText>)
      continue
    }

    const nextItem = parts[i + 1]
    const nextLeadsWithNonWhitespace =
      nextItem && nextItem.type === 'literal' && LEADING_NON_WHITESPACE_RE.test(nextItem.value)
    if (nextLeadsWithNonWhitespace) {
      // This is the 'oxford comma' case, where we want to include any leading non-whitespace from
      // the literal as trailing characters to the element we are currently adding.
      const [nonWhitespace = ''] = nextItem.value.match(LEADING_NON_WHITESPACE_RE) || []

      elements.push(
        // Key (value) is user ID, thus unique
        <TextGroup key={item.value}>
          <InlineText weight="medium">
            <UserDisplayName currentUserId={currentUserId} isFirst={i === 0} userId={item.value} />
          </InlineText>
          <InlineText>{nonWhitespace}</InlineText>
        </TextGroup>,
      )

      // Rewrite the next item to not contain this leading non-whitespace
      nextItem.value = nextItem.value.slice(nonWhitespace.length)
      continue
    }

    // Literals have been taken care of and returns early, so the only remaining case is that we're
    // in an element that does _not_ have a leading non-whitespace literal following it.
    elements.push(
      // Key (value) is user ID, thus unique
      <InlineText weight="medium" key={item.value}>
        <UserDisplayName currentUserId={currentUserId} isFirst={i === 0} userId={item.value} />
      </InlineText>,
    )
  }

  return elements
}

export function CommentReactionsUsersTooltipContent(
  props: Omit<CommentReactionsUsersTooltipProps, 'children'>,
) {
  const {currentUser, reactionName, userIds} = props
  const {t} = useTranslation(commentsLocaleNamespace)

  const UserList = useCallback(() => {
    if (!currentUser) return null
    return <FormattedUserList currentUserId={currentUser.id} userIds={userIds} />
  }, [currentUser, userIds])

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
