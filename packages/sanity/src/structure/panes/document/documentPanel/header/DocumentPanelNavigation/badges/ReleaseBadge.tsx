import {type ReleaseDocument} from '@sanity/client'
import {useCallback} from 'react'
import {
  getReleaseIdFromReleaseDocumentId,
  getReleaseTone,
  ReleaseTitle,
  useTranslation,
} from 'sanity'

import {NavigationBadge} from './NavigationBadge'
import {type NavigationBadges} from './useNavigationBadges'

/** @internal */
export function ReleaseBadge(props: {
  navigate: NavigationBadges['navigate']
  release: ReleaseDocument
  selected: boolean
}) {
  const {navigate, release, selected} = props
  const {t} = useTranslation()
  const handleClick = useCallback(() => navigate(release), [navigate, release])

  return (
    <ReleaseTitle
      title={release.metadata.title}
      fallback={t('release.placeholder-untitled-release')}
      enableTooltip={false}
    >
      {({displayTitle}) => (
        <NavigationBadge
          active
          avatar={release}
          data-testid={`document-panel-navigation-badge-release-${getReleaseIdFromReleaseDocumentId(release._id)}`}
          onClick={handleClick}
          selected={selected}
          text={displayTitle}
          tone={getReleaseTone(release)}
        />
      )}
    </ReleaseTitle>
  )
}
