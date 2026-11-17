import {AvatarStack} from '@sanity/ui'

import {UserAvatar} from '../../../components/userAvatar/UserAvatar'
import {useListFormat} from '../../../hooks/useListFormat'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {studioLocaleNamespace} from '../../../i18n/localeNamespaces'
import {type VersionPresence as VersionPresenceList} from '../../utils/groupPresenceByVersion'

/**
 * How many entries the stack shows: up to two avatars, or the count of the rest and the most
 * recently active person. The same limit as the document list row's presence.
 */
const MAX_STACK_LENGTH = 2

/**
 * The cell of a version row's presence column: an avatar for each person who has that version
 * open. The cell is always rendered, empty when nobody has the version open, so the column holds
 * its place on every row.
 *
 * The avatars carry no native tooltip. The stack's accessible name lists the people instead.
 *
 * @internal
 */
export function VersionPresence({presence}: {presence: VersionPresenceList}) {
  const {t} = useTranslation(studioLocaleNamespace)
  const listFormat = useListFormat()

  if (presence.length === 0) {
    return <span className="version-presence" />
  }

  const names = listFormat.format(presence.map(({user}) => user.displayName ?? user.id))

  return (
    <span className="version-presence" data-testid="version-presence">
      <AvatarStack
        maxLength={MAX_STACK_LENGTH}
        size={0}
        role="img"
        aria-label={t('document-group.version.presence', {count: presence.length, names})}
      >
        {presence.map(({user}) => (
          <UserAvatar key={user.id} user={user} hideTitle />
        ))}
      </AvatarStack>
    </span>
  )
}
