/* eslint-disable no-nested-ternary */
import {Card, Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {isReleaseScheduledOrScheduling, type ReleaseDocument} from '../../index'
import {ReleasePublishAllButton} from '../components/releaseCTAButtons/ReleasePublishAllButton'
import {ReleaseRevertButton} from '../components/releaseCTAButtons/ReleaseRevertButton/ReleaseRevertButton'
import {ReleaseScheduleButton} from '../components/releaseCTAButtons/ReleaseScheduleButton'
import {ReleaseUnscheduleButton} from '../components/releaseCTAButtons/ReleaseUnscheduleButton'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {type ReleaseEvent} from './events/types'
import {ReleaseStatusItems} from './ReleaseStatusItems'
import {type DocumentInRelease} from './useBundleDocuments'

export function ReleaseDashboardFooter(props: {
  documents: DocumentInRelease[]
  release: ReleaseDocument
  events: ReleaseEvent[]
}) {
  const {documents, release, events} = props

  const releaseActionButton = useMemo(() => {
    if (release.state === 'archived') return null

    if (isReleaseScheduledOrScheduling(release)) {
      return (
        <ReleaseUnscheduleButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      )
    }

    if (release.state === 'active') {
      if (release.metadata.releaseType === 'scheduled') {
        return (
          <ReleaseScheduleButton
            release={release}
            documents={documents}
            disabled={!documents.length}
          />
        )
      }

      return (
        <ReleasePublishAllButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      )
    }

    if (release.state === 'published') {
      return (
        <ReleaseRevertButton release={release} documents={documents} disabled={!documents.length} />
      )
    }

    return null
  }, [documents, release])

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flex={1} gap={1}>
          <ReleaseStatusItems events={events} release={release} />
        </Flex>

        <Flex flex="none" gap={1} data-testid="release-dashboard-footer-actions">
          {releaseActionButton}
          <ReleaseMenuButton release={release} documentsCount={documents.length} ignoreCTA />
        </Flex>
      </Flex>
    </Card>
  )
}
