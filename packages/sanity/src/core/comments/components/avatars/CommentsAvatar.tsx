import {type User} from '@sanity/types'
import {Avatar, type AvatarProps, type AvatarSize} from '@sanity/ui'
import {useMemo} from 'react'

import {styledAvatar} from './CommentsAvatar.css'

const SYMBOLS = /[^\p{Alpha}\p{White_Space}]/gu
const WHITESPACE = /\p{White_Space}+/u

function nameToInitials(fullName: string) {
  const namesArray = fullName.replace(SYMBOLS, '').split(WHITESPACE)

  if (namesArray.length === 1) {
    return `${namesArray[0].charAt(0)}`.toUpperCase()
  }

  return `${namesArray[0].charAt(0)}${namesArray[namesArray.length - 1].charAt(0)}`
}

interface CommentsAvatarProps extends AvatarProps {
  user: User | undefined | null
  size?: AvatarSize
}

export function CommentsAvatar(props: CommentsAvatarProps) {
  const {user, ...restProps} = props
  const initials = useMemo(() => nameToInitials(user?.displayName || ''), [user?.displayName])

  if (!user) return <Avatar className={styledAvatar} {...restProps} />

  return (
    <Avatar
      className={styledAvatar}
      initials={initials}
      src={user?.imageUrl}
      title={user?.displayName}
      {...restProps}
    />
  )
}
