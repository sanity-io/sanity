import React, {useCallback, useMemo, useRef} from 'react'
import {CurrentUser} from '@sanity/types'
import {
  // eslint-disable-next-line no-restricted-imports
  Button as UIButton,
  Flex,
  Text,
} from '@sanity/ui'
import {
  CommentReactionItem,
  CommentReactionOption,
  CommentReactionShortNames,
  CommentsUIMode,
} from '../../types'
import {COMMENT_REACTION_EMOJIS, COMMENT_REACTION_OPTIONS} from '../../constants'
import {ReactionIcon} from '../icons'
import {Tooltip, TooltipDelayGroupProvider} from '../../../../../ui-components'
import {CommentReactionsMenuButton} from './CommentReactionsMenuButton'
import {CommentReactionsUsersTooltip} from './CommentReactionsUsersTooltip'
import {EmojiText} from './EmojiText.styled'
import {TransparentCard} from './TransparentCard.styled'

/**
 * A function that groups reactions by name. For example:
 *
 * ```js
 * [
 *  [':name:', [{shortName: ':name:', userId: 'user1'}, {shortName: ':name:', userId: 'user2'}],
 *  [':name2:', [{shortName: ':name2:', userId: 'user1'}]
 * ]
 *```
 */
function groupReactionsByName(reactions: CommentReactionItem[]) {
  const grouped = reactions.reduce(
    (acc, reaction) => {
      const {shortName} = reaction

      if (!acc[shortName]) {
        acc[shortName] = []
      }

      acc[shortName].push(reaction)

      return acc
    },
    {} as Record<CommentReactionShortNames, CommentReactionItem[]>,
  )

  // Sort based on the first appearance of the reaction in `reactions` array.
  // This is to ensure that the order of the reactions is consistent so that
  // the reactions are not jumping around when new reactions are added.
  const sorted = Object.entries(grouped).sort(([nameA], [nameB]) => {
    const indexA = reactions.findIndex((r) => r.shortName === nameA)
    const indexB = reactions.findIndex((r) => r.shortName === nameB)

    return indexA - indexB
  })

  return sorted as [CommentReactionShortNames, CommentReactionItem[]][]
}

const renderMenuButton = ({open, tooltipContent}: {open: boolean; tooltipContent: string}) => {
  return (
    <UIButton fontSize={1} mode="ghost" padding={0} radius="full" selected={open}>
      <Flex paddingX={3} paddingY={2}>
        <Tooltip animate content={tooltipContent} disabled={open}>
          <Text size={1}>
            <ReactionIcon />
          </Text>
        </Tooltip>
      </Flex>
    </UIButton>
  )
}

interface CommentReactionsBarProps {
  currentUser: CurrentUser
  onSelect: (reaction: CommentReactionOption) => void
  reactions: CommentReactionItem[]
  readOnly?: boolean
  mode: CommentsUIMode
}

export const CommentReactionsBar = React.memo(function CommentReactionsBar(
  props: CommentReactionsBarProps,
) {
  const {currentUser, onSelect, reactions, readOnly, mode} = props
  const handleSelect = useCallback(
    (name: CommentReactionShortNames) => {
      const option = COMMENT_REACTION_OPTIONS.find((o) => o.shortName === name)

      if (option) {
        onSelect(option)
      }
    },
    [onSelect],
  )

  // The list of the current user's reactions, e.g. [':+1:', ':heart:']
  const currentUserReactionNames = useMemo(() => {
    return reactions.filter((r) => r.userId === currentUser?.id).map((r) => r.shortName)
  }, [currentUser?.id, reactions])

  // Reactions grouped by name, e.g. [ [':+1:', [{shortName: ':+1:', userId: 'user1'}] ] ]
  const groupedReactions = useMemo(() => {
    const grouped = groupReactionsByName(reactions)

    // Filter out reactions that are not in the `COMMENT_REACTION_EMOJIS` map.
    return grouped.filter(([name]) => COMMENT_REACTION_EMOJIS[name])
  }, [reactions])

  // An array of the initial order of the reactions. This is used to sort the reactions.
  // E.g. [':+1:', ':heart:']
  const sortOrder = useRef<string[]>(Object.keys(Object.fromEntries(groupedReactions)))

  // Sort the reactions based on the initial order to make sure that the reactions
  // are not jumping around when new reactions are added.
  const sortedReactions = useMemo(() => {
    const sorted = groupedReactions.sort(([nameA], [nameB]) => {
      const indexA = sortOrder.current.indexOf(nameA)
      const indexB = sortOrder.current.indexOf(nameB)

      if (indexA === -1) {
        return 1
      }

      if (indexB === -1) {
        return -1
      }

      return indexA - indexB
    })

    sortOrder.current = sorted.map(([name]) => name)

    return sorted
  }, [groupedReactions])

  return (
    <Flex align="center" gap={1} wrap="wrap">
      <TooltipDelayGroupProvider>
        {sortedReactions.map(([name, reactionsList]) => {
          const hasReacted = currentUserReactionNames.includes(name)
          const userIds = reactionsList.map((r) => r.userId)
          const emoji = COMMENT_REACTION_EMOJIS[name]

          return (
            <CommentReactionsUsersTooltip
              currentUser={currentUser}
              key={name}
              reactionName={name}
              userIds={userIds}
            >
              <TransparentCard tone="default">
                <UIButton
                  disabled={readOnly || mode === 'upsell'}
                  mode="ghost"
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={() => handleSelect(name)}
                  padding={2}
                  radius="full"
                  selected={hasReacted}
                  tone={hasReacted ? 'primary' : 'default'}
                >
                  <Flex align="center" gap={1}>
                    <EmojiText size={1}>{emoji}</EmojiText>

                    <Text size={0} weight={hasReacted ? 'semibold' : 'medium'}>
                      {reactionsList?.length}
                    </Text>
                  </Flex>
                </UIButton>
              </TransparentCard>
            </CommentReactionsUsersTooltip>
          )
        })}

        <TransparentCard tone="default">
          <CommentReactionsMenuButton
            mode={mode}
            // eslint-disable-next-line react/jsx-no-bind
            onSelect={(o) => handleSelect(o.shortName)}
            options={COMMENT_REACTION_OPTIONS}
            readOnly={readOnly}
            renderMenuButton={renderMenuButton}
          />
        </TransparentCard>
      </TooltipDelayGroupProvider>
    </Flex>
  )
})
