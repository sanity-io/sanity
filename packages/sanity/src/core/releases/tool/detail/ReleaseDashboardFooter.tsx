/* eslint-disable no-nested-ternary */
import {Card, Flex} from '@sanity/ui'
import {useMemo} from 'react'

import {isReleaseScheduledOrScheduling, type ReleaseDocument} from '../../index'
import {ReleasePublishAllButton} from '../components/releaseCTAButtons/ReleasePublishAllButton'
import {ReleaseScheduleButton} from '../components/releaseCTAButtons/ReleaseScheduleButton'
import {ReleaseUnscheduleButton} from '../components/releaseCTAButtons/ReleaseUnscheduleButton'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleaseStatusItems} from './ReleaseStatusItems'
import {type DocumentInRelease} from './useBundleDocuments'

export function ReleaseDashboardFooter(props: {
  documents: DocumentInRelease[]
  release: ReleaseDocument
}) {
  const {documents, release} = props

  const releaseActionButton = useMemo(() => {
    if (release.metadata.releaseType === 'scheduled') {
      return isReleaseScheduledOrScheduling(release) ? (
        <ReleaseUnscheduleButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      ) : (
        <ReleaseScheduleButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      )
    }

    if (release.state === 'active') {
      return (
        <ReleasePublishAllButton
          release={release}
          documents={documents}
          disabled={!documents.length}
        />
      )
    }

    return null
  }, [documents, release])

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flex={1} gap={1}>
          <ReleaseStatusItems release={release} />
        </Flex>

        <Flex flex="none" gap={1}>
          {releaseActionButton}
          <ReleaseMenuButton release={release} ignoreCTA />
        </Flex>
      </Flex>
    </Card>
  )
}
