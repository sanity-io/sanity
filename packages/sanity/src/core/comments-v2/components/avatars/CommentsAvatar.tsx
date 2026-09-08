import {type User} from '@sanity/types'
import {Avatar, type AvatarProps} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

const StyledAvatar = styled(Avatar)`
  svg > ellipse {
    stroke: transparent;
  }
`

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
  const {user: userProp, ...restProps} = props
  const user = userProp as User
  const initials = useMemo(() => nameToInitials(user?.displayName || ''), [user?.displayName])

  if (!user) return <StyledAvatar {...restProps} />

  return (
    <StyledAvatar
      initials={initials}
      src={user?.imageUrl}
      title={user?.displayName}
      {...restProps}
    />
  )
}
