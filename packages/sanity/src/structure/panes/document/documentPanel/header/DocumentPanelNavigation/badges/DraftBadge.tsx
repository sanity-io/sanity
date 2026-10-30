import {useCallback} from 'react'
import {LATEST, useTranslation} from 'sanity'

import {NavigationBadge} from './NavigationBadge'
import {type NavigationBadges, type NavigationBadgeState} from './useNavigationBadges'

/** @internal */
export function DraftBadge(props: {
  navigate: NavigationBadges['navigate']
  state: NavigationBadgeState
}) {
  const {navigate, state} = props
  const {t} = useTranslation()
  const handleClick = useCallback(() => navigate(LATEST), [navigate])

  return (
    <NavigationBadge
      active={state.active}
      avatar={LATEST}
      data-testid="document-panel-navigation-badge-draft"
      onClick={handleClick}
      selected={state.selected}
      text={t('release.chip.draft')}
      tone="caution"
    />
  )
}
