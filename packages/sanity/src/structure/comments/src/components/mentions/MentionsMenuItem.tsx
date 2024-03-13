import {Badge, Box, Card, Flex, Text, TextSkeleton} from '@sanity/ui'
import type * as React from 'react'
import {useCallback, useMemo} from 'react'
import {useTranslation, useUser} from 'sanity'
import styled from 'styled-components'

import {commentsLocaleNamespace} from '../../../i18n'
import {CommentsAvatar} from '../avatars'
import {type MentionsMenuUser} from './MentionsMenu'

const InnerFlex = styled(Flex)``

const TextBox = styled(Box)`
  flex: 1;
`

const SKELETON_INLINE_STYLE: React.CSSProperties = {width: '75%'}

interface MentionsItemProps {
  user: MentionsMenuUser
  onSelect: (userId: string) => void
}

export function MentionsMenuItem(props: MentionsItemProps) {
  const {user, onSelect} = props
  const [loadedUser] = useUser(user.id)
  const {t} = useTranslation(commentsLocaleNamespace)

  const isReset = user?.type === 'reset'

  const avatar = useMemo(() => {
    if (isReset) {
      return <CommentsAvatar user={loadedUser} status={'inactive'} />
    }

    return <CommentsAvatar user={loadedUser} status={user.granted ? undefined : 'inactive'} />
  }, [isReset, loadedUser, user.granted])

  const text = useMemo(() => {
    if (isReset) {
      return <Text size={1}>{user?.displayName}</Text>
    }

    return loadedUser ? (
      <Text size={1} textOverflow="ellipsis" title={loadedUser.displayName}>
        {loadedUser.displayName}
      </Text>
    ) : (
      <TextSkeleton animated size={1} style={SKELETON_INLINE_STYLE} />
    )
  }, [isReset, loadedUser, user?.displayName])

  const handleSelect = useCallback(() => {
    onSelect(user.id)
  }, [onSelect, user.id])

  return (
    <Card as="button" disabled={!user.granted} onClick={handleSelect} padding={2} radius={2}>
      <Flex align="center" gap={3}>
        <InnerFlex align="center" gap={2} flex={1}>
          <Box>{avatar}</Box>
          <TextBox>{text}</TextBox>
        </InnerFlex>

        {!user.granted && (
          <Badge fontSize={1} mode="outline">
            {t('mentions.unauthorized-user')}
          </Badge>
        )}
      </Flex>
    </Card>
  )
}
