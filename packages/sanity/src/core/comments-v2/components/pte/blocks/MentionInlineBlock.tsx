import {Text, TextSkeleton} from '@sanity/ui'
import {css, styled} from 'styled-components'
import {Flex} from 'ui5'

import {Tooltip} from '../../../../../ui-components/tooltip/Tooltip'
import {useCurrentUser, useUser} from '../../../../store/user/hooks'
import {CommentsAvatar} from '../../avatars/CommentsAvatar'

const Span = styled.span(({theme}) => {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {regular} = theme.sanity.fonts?.text.weights || {}
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const {hovered} = theme.sanity.color?.card || {}
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
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

          <Text size={1}>{user.displayName}</Text>
        </Flex>
      }
    >
      <Span data-selected={selected} data-active={currentUser?.sanityUserId === userId}>
        @{user.displayName}
      </Span>
    </Tooltip>
  )
}
