/* eslint-disable no-nested-ternary */
import {Card, Flex} from '@sanity/ui'

import {type ReleaseDocument} from '../../../store'
import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleasePublishAllButton} from '../components/ReleasePublishAllButton/ReleasePublishAllButton'
import {ReleaseScheduleButton} from '../components/ReleasePublishAllButton/ReleaseScheduleButton'
import {ReleaseUnscheduleButton} from '../components/ReleasePublishAllButton/ReleaseUnscheduleButton'
import {ReleaseStatusItems} from './ReleaseStatusItems'
import {type DocumentInRelease} from './useBundleDocuments'

export function ReleaseDashboardFooter(props: {
  documents: DocumentInRelease[]
  release: ReleaseDocument
}) {
  const {documents, release} = props

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flex={1} gap={1}>
          <ReleaseStatusItems release={release} />
        </Flex>

        <Flex flex="none" gap={1}>
          {release.metadata.releaseType === 'scheduled' ? (
            release.state === 'scheduled' || release.state === 'scheduling' ? (
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
          ) : (
            <ReleasePublishAllButton
              release={release}
              documents={documents}
              disabled={!documents.length}
            />
          )}
          <ReleaseMenuButton release={release} />
        </Flex>
      </Flex>
    </Card>
  )
}
