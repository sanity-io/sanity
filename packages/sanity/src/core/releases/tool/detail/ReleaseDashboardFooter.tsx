import {Card, Flex} from '@sanity/ui'
import {type ReleaseDocument} from 'sanity'

import {ReleaseMenuButton} from '../components/ReleaseMenuButton/ReleaseMenuButton'
import {ReleasePublishAllButton} from '../components/ReleasePublishAllButton/ReleasePublishAllButton'
import {ReleaseStatusItems} from './ReleaseStatusItems'
import {type DocumentInBundleResult} from './useBundleDocuments'

export function ReleaseDashboardFooter(props: {
  documents: DocumentInBundleResult[]
  release: ReleaseDocument
  isBundleDeleted: boolean
}) {
  const {documents, release, isBundleDeleted} = props

  return (
    <Card flex="none">
      <Card borderTop marginX={2} style={{opacity: 0.6}} />

      <Flex padding={3}>
        <Flex flex={1} gap={1}>
          <ReleaseStatusItems release={release} />
        </Flex>

        <Flex flex="none" gap={1}>
          {/* TODO: Replace this with the real actions. */}
          {!isBundleDeleted && !release.publishAt && (
            <ReleasePublishAllButton
              release={release}
              bundleDocuments={documents}
              disabled={!documents.length}
            />
          )}
          <ReleaseMenuButton disabled={isBundleDeleted} release={release} />
        </Flex>
      </Flex>
    </Card>
  )
}
