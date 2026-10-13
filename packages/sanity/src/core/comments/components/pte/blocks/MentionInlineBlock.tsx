import {TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {Text, Flex} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useCurrentUser, useUser} from '../../../../store/user/hooks'
import {CommentsAvatar} from '../../avatars/CommentsAvatar'
import {
  cautionPressedBgVar,
  fontWeightRegularVar,
  hoveredBgVar,
  span,
} from './MentionInlineBlock.css'

interface MentionInlineBlockProps {
  userId: string
  selected: boolean
}

export function MentionInlineBlock(props: MentionInlineBlockProps) {
  const {selected, userId} = props
  const [user, loading] = useUser(userId)
  const currentUser = useCurrentUser()
  const {color, font} = useThemeV2()

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
        <Flex alignItems="center" gap={2}>
          <Flex>
            <CommentsAvatar user={user} />
          </Flex>

          <Text size={1} as="div" trim={true}>
            {user.displayName}
          </Text>
        </Flex>
      }
    >
      <span
        className={span}
        style={assignInlineVars({
          [fontWeightRegularVar]: String(font.text.weights.regular),
          [hoveredBgVar]: color.selectable.default.hovered.bg,
          [cautionPressedBgVar]: color.selectable.caution.pressed.bg,
        })}
        data-selected={selected}
        data-active={currentUser?.id === userId}
      >
        @{user.displayName}
      </span>
    </Tooltip>
  )
}
