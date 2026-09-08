import {type ReleaseDocument} from '@sanity/client'
import {Card} from '@sanity/ui'
import {Flex} from 'ui5'

import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {type ReleaseEvent} from './events/types'
import {ReleaseActionButton} from './ReleaseActionButton'
import {ReleaseStatusItems} from './ReleaseStatusItems'
import {type DocumentInRelease} from './types'

export function ReleaseDashboardFooter(props: {
  documents: DocumentInRelease[]
  release: ReleaseDocument
  events: ReleaseEvent[]
}) {
  const {documents, release, events} = props

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flexBasis="0%" flexGrow={1} gap={1}>
          <ReleaseStatusItems events={events} release={release} />
        </Flex>

        <Flex
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          gap={1}
          data-testid="release-dashboard-footer-actions"
        >
          <ReleaseActionButton release={release} documents={documents} />
          <ReleaseMenuButton
            release={release}
            documentsCount={documents.length}
            documents={documents}
            ignoreCTA={release.metadata.releaseType !== 'undecided'}
          />
        </Flex>
      </Flex>
    </Card>
  )
}
