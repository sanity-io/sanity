import {useCallback} from 'react'

import {NavigationBadge} from './NavigationBadge'
import {type NavigationBadges} from './useNavigationBadges'

/** @internal */
export function AgentChangesBadge(props: {
  agent: NonNullable<NavigationBadges['agent']>
  navigate: NavigationBadges['navigate']
}) {
  const {agent, navigate} = props
  const {bundleId, display, selected} = agent
  const handleClick = useCallback(() => navigate(bundleId), [bundleId, navigate])

  return (
    <NavigationBadge
      active
      avatar={bundleId}
      data-testid="document-panel-navigation-badge-agent"
      onClick={handleClick}
      selected={selected}
      text={display.displayName}
      tone={display.tone}
    />
  )
}
