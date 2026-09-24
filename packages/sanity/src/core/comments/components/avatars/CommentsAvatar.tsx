import {type User} from '@sanity/types'
import {Avatar, type AvatarProps} from '@sanity/ui'
import {clsx} from 'clsx'
import {useMemo} from 'react'

import {commentsAvatar} from './CommentsAvatar.css'

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
}

export function CommentsAvatar(props: CommentsAvatarProps) {
  const {user: userProp, className, ...restProps} = props
  const user = userProp as User
  const initials = useMemo(() => nameToInitials(user?.displayName || ''), [user?.displayName])

  if (!user) return <Avatar {...restProps} className={clsx(commentsAvatar, className)} />

  return (
    <Avatar
      initials={initials}
      src={user?.imageUrl}
      title={user?.displayName}
      {...restProps}
      className={clsx(commentsAvatar, className)}
    />
  )
}
