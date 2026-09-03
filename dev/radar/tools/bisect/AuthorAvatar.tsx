import {Avatar} from '@sanity/ui'

import {useAuthorAvatarUrl} from './useGravatar'

/** Commit author's avatar (synced GitHub avatarUrl, noreply parse, login, then gravatar), initials meanwhile. */
export function AuthorAvatar(props: {
  name?: string
  email?: string
  login?: string
  avatarUrl?: string
  size?: 0 | 1
}) {
  const {name, email, login, avatarUrl, size = 0} = props
  const url = useAuthorAvatarUrl({avatarUrl, email, login})
  const initials = (name ?? '?')
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return <Avatar src={url} initials={initials} size={size} title={name} />
}
