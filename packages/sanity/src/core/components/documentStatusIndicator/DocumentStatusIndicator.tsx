import {Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'

import {type VersionInfoDocumentStub} from '../../releases'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'

interface DocumentStatusProps {
  draft?: VersionInfoDocumentStub | undefined
  published?: VersionInfoDocumentStub | undefined
  versions?: Record<string, VersionInfoDocumentStub | undefined>
}

const Dot = styled.div<{$index: number}>`
  width: 5px;
  height: 5px;
  background-color: var(--card-icon-color);
  border-radius: 999px;
  box-shadow: 0 0 0 1px var(--card-bg-color);
  z-index: ${({$index}) => $index};
  &[data-status='not-published'] {
    --card-icon-color: var(--card-badge-default-dot-color);
    opacity: 0.5 !important;
  }
  &[data-status='draft'] {
    --card-icon-color: var(--card-badge-caution-dot-color);
  }
  &[data-status='asap'] {
    --card-icon-color: var(--card-badge-critical-dot-color);
  }
  &[data-status='undecided'] {
    --card-icon-color: var(--card-badge-suggest-dot-color);
  }
  &[data-status='scheduled'] {
    --card-icon-color: var(--card-badge-primary-dot-color);
  }
`

type Status = 'not-published' | 'draft' | 'asap' | 'scheduled' | 'undecided'

/**
 * Renders a dot indicating the current document status.
 *
 * @internal
 */
export function DocumentStatusIndicator({draft, published, versions}: DocumentStatusProps) {
  const {data: releases} = useActiveReleases()
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
      status: draft && !published ? 'not-published' : 'draft',
      show: Boolean(draft),
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
