import {Flex, Text, TextSkeleton} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'

import {Tooltip} from '../../../../../ui-components'
import {useCurrentUser, useUser} from '../../../../store'
import {CommentsAvatar} from '../../avatars'
import {activeBgVar, fontWeightVar, hoveredBgVar, mentionSpan} from './MentionInlineBlock.css'

interface MentionInlineBlockProps {
  userId: string
  selected: boolean
}

export function MentionInlineBlock(props: MentionInlineBlockProps) {
  const {selected, userId} = props
  const [user, loading] = useUser(userId)
  const currentUser = useCurrentUser()
  const theme = useThemeV2()

  if (!user || loading)
    return (
      <TextSkeleton
        data-testid="comment-mentions-loading-skeleton"
        style={{width: '10ch'}}
        size={0}
        muted
        radius={1}
        animated
      />
    )

  return (
    <Tooltip
      portal
      content={
        <Flex align="center" gap={2}>
          <Flex>
            <CommentsAvatar user={user} />
          </Flex>

          <Text size={1}>{user.displayName}</Text>
        </Flex>
      }
    >
      <span
        className={mentionSpan}
        style={assignInlineVars({
          [fontWeightVar]: String(theme.font.text.weights.regular),
          [hoveredBgVar]: theme.color.card.hovered.bg,
          [activeBgVar]: theme.color.selectable.caution.pressed.bg,
        })}
        data-selected={selected}
        data-active={currentUser?.id === userId}
      >
        @{user.displayName}
      </span>
    </Tooltip>
  )
}
