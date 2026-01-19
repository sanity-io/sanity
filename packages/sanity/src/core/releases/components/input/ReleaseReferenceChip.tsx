import {type ReleaseDocument} from '@sanity/client'
import {useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {useAllReleases} from '../../store/useAllReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../util/getReleaseIdFromReleaseDocumentId'

const ARCHIVED_RELEASE_STATES = ['archived', 'published']

const ChipSpan = styled.span<{$clickable: boolean; $archived: boolean}>(
  ({theme, $clickable, $archived}) => {
    const {regular} = theme.sanity.fonts?.text.weights || {}
    const caution = theme.sanity.color.selectable?.caution || {}

    return `
    display: inline-flex;
    align-items: center;
    font-weight: ${regular};
    color: ${$archived ? 'var(--card-muted-fg-color)' : 'var(--card-link-fg-color)'};
    background-color: ${caution.enabled?.bg || 'var(--card-hovered-bg-color)'};
    border: 1px solid ${caution.enabled?.border || 'var(--card-border-color)'};
    border-radius: 4px;
    padding: 2px 6px;
    margin: 0 2px;
    cursor: ${$clickable ? 'pointer' : 'not-allowed'};
    text-decoration: none;
    font-size: 0.9em;

    &:hover {
      background-color: ${$clickable ? (caution.hovered?.bg || 'var(--card-hovered-bg-color)') : undefined};
    }

    &[data-selected='true'] {
      background-color: ${caution.pressed?.bg || 'var(--card-selected-bg-color)'};
    }
  `
  },
)

interface ReleaseReferenceChipProps {
  releaseId: string
  selected: boolean
}

export function ReleaseReferenceChip(props: ReleaseReferenceChipProps) {
  const {releaseId, selected} = props
  const router = useRouter()
  const {data: releases, loading} = useAllReleases()

  // Look up release by ID
  const release = useMemo<ReleaseDocument | null>(() => {
    if (loading || !releases) return null
    return (
      releases.find((r) => getReleaseIdFromReleaseDocumentId(r._id) === releaseId) || null
    )
  }, [releases, releaseId, loading])

  const isArchived = release && ARCHIVED_RELEASE_STATES.includes(release.state)
  const isDeleted = !loading && !release
  const isClickable = Boolean(release && !isDeleted)

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault()
    if (isClickable && release) {
      // Open in new tab
      const url = router.resolvePathFromState({releaseId})
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Render states
  if (loading) {
    return (
      <ChipSpan $clickable={false} $archived={false} data-selected={selected}>
        Loading...
      </ChipSpan>
    )
  }

  if (isDeleted) {
    return (
      <ChipSpan $clickable={false} $archived={false} data-selected={selected}>
        release unavailable
      </ChipSpan>
    )
  }

  const displayText = isArchived
    ? `${release.metadata.title || 'Untitled Release'} (archived)`
    : release.metadata.title || 'Untitled Release'

  return (
    <ChipSpan
      $clickable={isClickable}
      $archived={Boolean(isArchived)}
      data-selected={selected}
      onClick={handleClick}
      title={isClickable ? `Click to open ${displayText} in new tab` : undefined}
    >
      {displayText}
    </ChipSpan>
  )
}
