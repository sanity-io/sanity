import React, {useCallback, useMemo, useRef} from 'react'
import {CurrentUser} from '@sanity/types'
import {Card, Flex, Text, TooltipDelayGroupProvider} from '@sanity/ui'
import styled from 'styled-components'
import {CommentReactionItem, CommentReactionOption, CommentReactionShortNames} from '../../types'
import {COMMENT_REACTION_EMOJIS, COMMENT_REACTION_OPTIONS} from '../../constants'
import {ReactionIcon} from '../icons'
import {TOOLTIP_DELAY_PROPS, Tooltip} from '../../../../../ui-components'
import {CommentReactionsMenuButton} from './CommentReactionsMenuButton'
import {CommentReactionsUsersTooltip} from './CommentReactionsUsersTooltip'

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

const ReactionButtonCard = styled(Card)`
  max-width: max-content;
  border: 1px solid var(--card-border-color) !important;
`

const renderMenuButton = ({open}: {open: boolean}) => (
  <ReactionButtonCard
    __unstable_focusRing
    forwardedAs="button"
    pressed={open}
    radius={6}
    tone="transparent"
    type="button"
  >
    <Tooltip animate content="Add reaction">
      <Flex align="center" justify="center" padding={2} paddingX={3}>
        <Text muted size={1}>
          <ReactionIcon />
        </Text>
      </Flex>
    </Tooltip>
  </ReactionButtonCard>
)

interface CommentReactionsBarProps {
  currentUser: CurrentUser
  onSelect: (reaction: CommentReactionOption) => void
  reactions: CommentReactionItem[]
}

export const CommentReactionsBar = React.memo(function CommentReactionsBar(
  props: CommentReactionsBarProps,
) {
  const {currentUser, onSelect, reactions} = props

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
      <TooltipDelayGroupProvider delay={TOOLTIP_DELAY_PROPS}>
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
              <ReactionButtonCard
                __unstable_focusRing
                border
                forwardedAs="button"
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleSelect(name)}
                padding={2}
                radius={6}
                tone={hasReacted ? 'primary' : 'transparent'}
                type="button"
              >
                <Flex align="center" gap={2}>
                  <Text size={1}>{emoji}</Text>

                  <Text size={1} weight={hasReacted ? 'medium' : undefined}>
                    {reactionsList?.length}
                  </Text>
                </Flex>
              </ReactionButtonCard>
            </CommentReactionsUsersTooltip>
          )
        })}

        <CommentReactionsMenuButton
          // eslint-disable-next-line react/jsx-no-bind
          onSelect={(o) => handleSelect(o.shortName)}
          options={COMMENT_REACTION_OPTIONS}
          renderMenuButton={renderMenuButton}
          selectedOptionNames={currentUserReactionNames}
        />
      </TooltipDelayGroupProvider>
    </Flex>
  )
})
