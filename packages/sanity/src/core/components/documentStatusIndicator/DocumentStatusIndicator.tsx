import {Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {css, styled} from 'styled-components'

import {RELEASE_TYPES_TONES} from '../../releases/util/const'
import type {VersionInfoDocumentStub} from '../../releases/store/types'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useWorkspace} from '../../studio/workspace'

interface DocumentStatusProps {
  draft?: VersionInfoDocumentStub | undefined
  published?: VersionInfoDocumentStub | undefined
  versions?: Record<string, VersionInfoDocumentStub | undefined>
}

const Dot = styled.div<{$index: number}>((props) => {
  const {$index} = props
  const tone = {
    asap: RELEASE_TYPES_TONES.asap.tone,
    scheduled: RELEASE_TYPES_TONES.scheduled.tone,
    undecided: RELEASE_TYPES_TONES.undecided.tone,
  }

  return css`
    width: 5px;
    height: 5px;
    background-color: var(--card-icon-color);
    border-radius: 999px;
    box-shadow: 0 0 0 1px var(--card-bg-color);
    z-index: ${$index};
    &[data-status='published'] {
      --card-icon-color: var(--card-badge-positive-dot-color);
    }
    &[data-status='draft'] {
      --card-icon-color: var(--card-badge-caution-dot-color);
    }
    &[data-status='asap'] {
      --card-icon-color: var(--card-badge-${tone.asap}-dot-color);
    }
    &[data-status='undecided'] {
      --card-icon-color: var(--card-badge-${tone.undecided}-dot-color);
    }
    &[data-status='scheduled'] {
      --card-icon-color: var(--card-badge-${tone.scheduled}-dot-color);
    }
  `
})

type Status = 'published' | 'draft' | 'asap' | 'scheduled' | 'undecided'

/**
 * Renders a dot indicating the current document status.
 *
 * @internal
 */
export function DocumentStatusIndicator({draft, published, versions}: DocumentStatusProps) {
  const {data: releases} = useActiveReleases()

  const {
    document: {
      drafts: {enabled: isDraftModelEnabled},
    },
  } = useWorkspace()

  const versionsList = useMemo(
    () =>
      versions
        ? Object.entries(versions).map(([versionName, snapshot]) => {
            if (!snapshot) {
              return undefined
            }
            const release = releases?.find(
              (r) => getReleaseIdFromReleaseDocumentId(r._id) === versionName,
            )
            return release?.metadata.releaseType
          })
        : [],
    [releases, versions],
  )

  const indicators: {
    status: Status
    show: boolean
  }[] = [
    {
      status: 'published',
      show: Boolean(published),
    },
    {
      status: 'draft' as const,
      show: isDraftModelEnabled && Boolean(draft),
    },
    {
      status: 'asap',
      show: versionsList.includes('asap'),
    },
    {
      status: 'scheduled',
      show: versionsList.includes('scheduled'),
    },
    {
      status: 'undecided',
      show: versionsList.includes('undecided'),
    },
  ]

  return (
    <Flex>
      {indicators
        .filter(({show}) => show)
        .map(({status}, index) => (
          <Dot key={status} data-status={status} $index={index + 1} />
        ))}
    </Flex>
  )
}
