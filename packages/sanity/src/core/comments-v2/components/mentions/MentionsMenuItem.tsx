import {Badge, Card, TextSkeleton} from '@sanity/ui'
import {type CSSProperties, useCallback} from 'react'
import {Text, Box, Flex} from 'ui5'

import {type UserWithPermission} from '../../../hooks/useUserListWithPermissions'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useUser} from '../../../store/user/hooks'
import {commentsLocaleNamespace} from '../../i18n'
import {CommentsAvatar} from '../avatars/CommentsAvatar'

const SKELETON_INLINE_STYLE: CSSProperties = {width: '50%'}

interface MentionsItemProps {
  user: UserWithPermission
  onSelect: (userId: string) => void
}

export function MentionsMenuItem(props: MentionsItemProps) {
  const {user, onSelect} = props
  const [loadedUser] = useUser(user.id)
  const {t} = useTranslation(commentsLocaleNamespace)

  const avatar = <CommentsAvatar user={loadedUser} status={user.granted ? undefined : 'inactive'} />

  const text = loadedUser ? (
    <Text size={1} truncate={1} title={loadedUser.displayName} as="div" trim={true}>
      {loadedUser.displayName}
    </Text>
  ) : (
    <TextSkeleton size={1} style={SKELETON_INLINE_STYLE} />
  )

  const handleSelect = useCallback(() => {
    onSelect(user.id)
  }, [onSelect, user.id])

  return (
    <Card as="button" disabled={!user.granted} onClick={handleSelect} padding={2} radius={2}>
      <Flex alignItems="center" gap={3}>
        <Flex alignItems="center" gap={2} flexBasis="0%" flexGrow={1}>
          {avatar}
          <Box>{text}</Box>
        </Flex>

        {!user.granted && <Badge fontSize={1}>{t('mentions.unauthorized-user')}</Badge>}
      </Flex>
    </Card>
  )
}
