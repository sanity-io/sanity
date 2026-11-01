import {ComposeSparklesIcon} from '@sanity/icons/ComposeSparkles'
import {type ComponentProps} from 'react'

import {Tooltip} from '../../ui-components/tooltip/Tooltip'
import {UserAvatar} from '../components/userAvatar/UserAvatar'
import {useTranslation} from '../i18n/hooks/useTranslation'
import {type PresenceActor} from '../store/presence/types'
import {agentBadge, agentAvatar} from './PresenceAvatar.css'

export function PresenceAvatar(props: ComponentProps<typeof UserAvatar> & {actor?: PresenceActor}) {
  const {actor, ...avatarProps} = props
  const {t} = useTranslation()
  if (actor?.type !== 'agent') return <UserAvatar {...avatarProps} />
  const displayName = typeof props.user === 'string' ? props.user : props.user.displayName
  const label = t('presence.agent-label', {displayName})
  const avatar = (
    <span className={agentAvatar} role="img" aria-label={label} data-presence-actor="agent">
      <span aria-hidden="true">
        <UserAvatar {...avatarProps} withTooltip={false} />
      </span>
      <span className={agentBadge} aria-hidden="true">
        <ComposeSparklesIcon />
      </span>
    </span>
  )
  if (!props.withTooltip) return avatar
  return (
    <Tooltip content={label} placement="top" portal>
      {avatar}
    </Tooltip>
  )
}
