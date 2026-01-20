import {type ReleaseDocument} from '@sanity/client'
import {type JSX, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'
import {releasesLocaleNamespace} from '../../i18n'
import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

function isArchivedRelease(release: ReleaseDocument): boolean {
  return release.state === 'archived' || release.state === 'published'
}

const ChipSpan = styled.span<{$clickable: boolean; $archived: boolean}>(
  ({theme, $clickable, $archived}) => {
    const {regular} = theme.sanity.fonts?.text.weights || {}
    const caution = theme.sanity.color.selectable?.caution

    return `
    display: inline-flex;
    align-items: center;
    font-weight: ${regular};
    color: ${$archived ? 'var(--card-muted-fg-color)' : 'var(--card-link-fg-color)'};
    background-color: ${caution?.enabled?.bg ?? 'var(--card-hovered-bg-color)'};
    border: 1px solid ${caution?.enabled?.border ?? 'var(--card-border-color)'};
    border-radius: 4px;
    padding: 2px 6px;
    margin: 0 2px;
    cursor: ${$clickable ? 'pointer' : 'not-allowed'};
    text-decoration: none;
    font-size: 0.9em;

    &:hover {
      background-color: ${$clickable ? (caution?.hovered?.bg ?? 'var(--card-hovered-bg-color)') : undefined};
    }

    &[data-selected='true'] {
      background-color: ${caution?.pressed?.bg ?? 'var(--card-selected-bg-color)'};
    }
  `
  },
)

interface ReleaseReferenceChipProps {
  releaseId: string
  selected: boolean
}

export function ReleaseReferenceChip(props: ReleaseReferenceChipProps): JSX.Element {
  const {releaseId, selected} = props
  const {t} = useTranslation(releasesLocaleNamespace)
  const router = useRouter()
  const {data: releases, loading} = useAllReleases()

  const release = useMemo<ReleaseDocument | null>(() => {
    if (loading) return null
    return releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId) ?? null
  }, [releases, releaseId, loading])

  if (loading) {
    return (
      <ChipSpan $clickable={false} $archived={false} data-selected={selected}>
        Loading...
      </ChipSpan>
    )
  }

  if (release === null) {
    return (
      <ChipSpan $clickable={false} $archived={false} data-selected={selected}>
        {t('release-reference.unavailable')}
      </ChipSpan>
    )
  }

  const isArchived = isArchivedRelease(release)
  const title = release.metadata.title || 'Untitled Release'
  const displayText = isArchived ? `${title} (archived)` : title

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>): void => {
    e.preventDefault()
    const url = router.resolvePathFromState({releaseId})
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <ChipSpan
      $clickable
      $archived={isArchived}
      data-selected={selected}
      onClick={handleClick}
      title={t('release-reference.title', {title: displayText})}
    >
      {displayText}
    </ChipSpan>
  )
}
