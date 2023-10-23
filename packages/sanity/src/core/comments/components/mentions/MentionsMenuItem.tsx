import {TextSkeleton, Flex, Text, Card, Box, Badge} from '@sanity/ui'
import React, {useCallback} from 'react'
import styled from 'styled-components'
import {MentionOptionUser} from '../../types'
import {useUser} from '../../../store'
import {CommentsAvatar} from '../avatars/CommentsAvatar'

const InnerFlex = styled(Flex)``

interface MentionsItemProps {
  user: MentionOptionUser
  onSelect: (userId: string) => void
}

export function MentionsMenuItem(props: MentionsItemProps) {
  const {user, onSelect} = props
  const [loadedUser] = useUser(user.id)

  const avatar = (
    <CommentsAvatar user={loadedUser} status={user.canBeMentioned ? undefined : 'inactive'} />
  )

  const text = loadedUser ? (
    <Text size={1} textOverflow="ellipsis" title={loadedUser.displayName}>
      {loadedUser.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={{width: '50%'}} />
  )

  const handleSelect = useCallback(() => {
    onSelect(user.id)
  }, [onSelect, user.id])

  return (
    <Card as="button" disabled={!user.canBeMentioned} onClick={handleSelect} padding={2} radius={2}>
      <Flex align="center" gap={3}>
        <InnerFlex align="center" gap={2} flex={1}>
          {avatar}
          <Box>{text}</Box>
        </InnerFlex>

        {!user.canBeMentioned && (
          <Badge fontSize={1} mode="outline">
            Unauthorized
          </Badge>
        )}
      </Flex>
    </Card>
  )
}
