import {Flex, Text, TextSkeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {useCurrentUser, useUser} from '../../../../store'
import {CommentsAvatar} from '../../avatars'

const Span = styled.span`
  font-weight: ${vars.font.text.weight.regular};
  color: ${vars.color.link.fg};
  border-radius: 2px;
  background-color: ${vars.color.tinted.default.bg[1]};
  padding: 1px;
  box-sizing: border-box;

  &[data-active='true'] {
    background-color: ${vars.color.tinted.default.bg[2]};
  }
`

interface MentionInlineBlockProps {
  userId: string
  selected: boolean
}

export function MentionInlineBlock(props: MentionInlineBlockProps) {
  const {selected, userId} = props
  const [user, loading] = useUser(userId)
  const currentUser = useCurrentUser()

  if (!user || loading)
    return (
      <TextSkeleton
        data-testid="comment-mentions-loading-skeleton"
        style={{width: '10ch'}}
        size={0}
        // @ts-expect-error - TODO: fix this in `@sanity/ui`
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
      <Span data-selected={selected} data-active={currentUser?.id === userId}>
        @{user.displayName}
      </Span>
    </Tooltip>
  )
}
