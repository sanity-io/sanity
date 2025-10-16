import {Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {type VersionInfoDocumentStub} from '../../releases'
import {useActiveReleases} from '../../releases/store/useActiveReleases'
import {getReleaseIdFromReleaseDocumentId} from '../../releases/util/getReleaseIdFromReleaseDocumentId'
import {useWorkspace} from '../../studio/workspace'
import * as styles from './DocumentStatusIndicator.css'

interface DocumentStatusProps {
  draft?: VersionInfoDocumentStub | undefined
  published?: VersionInfoDocumentStub | undefined
  versions?: Record<string, VersionInfoDocumentStub | undefined>
}

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
          <div key={status} className={styles.dotStyles[index + 1]} data-status={status} />
        ))}
    </Flex>
  )
}
