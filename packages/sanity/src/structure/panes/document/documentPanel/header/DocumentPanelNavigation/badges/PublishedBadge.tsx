import {useCallback} from 'react'
import {PUBLISHED, useTranslation} from 'sanity'

import {NavigationBadge} from './NavigationBadge'
import {type NavigationBadges, type NavigationBadgeState} from './useNavigationBadges'

/** @internal */
export function PublishedBadge(props: {
  navigate: NavigationBadges['navigate']
  state: NavigationBadgeState
}) {
  const {navigate, state} = props
  const {t} = useTranslation()
  const handleClick = useCallback(() => navigate(PUBLISHED), [navigate])

  return (
    <NavigationBadge
      active={state.active}
      avatar={PUBLISHED}
      data-testid="document-panel-navigation-badge-published"
      onClick={handleClick}
      selected={state.selected}
      text={t('release.chip.published')}
      tone="positive"
    />
  )
}
